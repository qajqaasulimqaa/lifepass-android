// Checkout + payment status, backed by the LifePass API (Kling hosted
// checkout). Mirrors iOS PaymentService.swift. Auth stays on Supabase; the
// bearer token rides on every apiPost/apiGet. The hosted page owns the price,
// so the app never computes or displays an ISK figure at checkout.
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { apiGet, apiPost, ApiError } from '../../api/client';

// Terms/privacy versions sent with checkout consent — must match the versions
// the web + iOS send so consent logs reference the same documents (iOS
// MerchantInfo.swift). Bump both together when the documents change.
const TERMS_VERSION = '2026-07-v1';
const PRIVACY_VERSION = '2026-07-v1';

// Native deep-link return URLs. Kling redirects the hosted checkout to these on
// completion / cancel; openAuthSessionAsync captures them and hands control
// back to the app.
export const PAYMENT_SUCCESS_URL = 'lifepass://payment-success';
export const PAYMENT_CANCEL_URL = 'lifepass://payment-canceled';

type CheckoutSessionResponse = {
  checkoutUrl?: string;
  url?: string;
  externalSessionId?: string;
};

export type CheckoutSession = { url: string; externalSessionId?: string };

/**
 * POST /payments/checkout-sessions → the Kling hosted-checkout URL.
 * `productSlug` is a v1 slug (`plan-*` / `pass-*`). Requires an Idempotency-Key
 * so a retry can't create a second checkout.
 */
export async function createCheckout(
  productSlug: string,
  opts?: { saveCard?: boolean },
): Promise<CheckoutSession> {
  const res = await apiPost<CheckoutSessionResponse>(
    '/payments/checkout-sessions',
    {
      productSlug,
      successUrl: PAYMENT_SUCCESS_URL,
      cancelUrl: PAYMENT_CANCEL_URL,
      ...(opts?.saveCard !== undefined ? { saveCard: opts.saveCard } : {}),
      terms: {
        acceptedAt: new Date().toISOString(),
        privacyVersion: PRIVACY_VERSION,
        termsVersion: TERMS_VERSION,
      },
    },
    { idempotencyKey: Crypto.randomUUID() },
  );

  const url = res.checkoutUrl ?? res.url;
  if (!url) throw new Error('Checkout could not be started. Please try again.');
  return { url, externalSessionId: res.externalSessionId };
}

/**
 * POST /payments/checkout-sessions/confirm — ask the server to run the verified
 * Kling pull for this session. Kling has NO webhook on the mobile path (on the
 * web, fulfilment happens when the /payment-success page renders, which a
 * deep-link return bypasses), so mobile must trigger it explicitly. A 404/405
 * (route not deployed) returns false and the caller falls back to polling.
 */
export async function confirmCheckout(externalSessionId: string): Promise<boolean> {
  try {
    const { status } = await apiPost<{ status?: string }>(
      '/payments/checkout-sessions/confirm',
      { externalSessionId },
      { idempotencyKey: Crypto.randomUUID() },
    );
    const s = status?.toLowerCase();
    return s === 'fulfilled' || s === 'completed' || s === 'paid' || s === 'already_fulfilled';
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return false;
    return false;
  }
}

/**
 * GET /payments/status → poll until fulfilment completes. The server emits
 * `pending` or `fulfilled`; returns true once `fulfilled`.
 */
export async function pollPaymentStatus(maxAttempts = 10): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { status } = await apiGet<{ status: string }>('/payments/status');
      if (status === 'fulfilled') return true;
    } catch {
      // transient — keep polling
    }
    const delayMs = Math.min(attempt + 1, 5) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export type CheckoutOutcome = 'fulfilled' | 'pending' | 'canceled';

/**
 * Full checkout flow: create the session, open Kling's hosted page, then settle
 * the outcome on return. openAuthSessionAsync opens a Chrome Custom Tab that
 * captures the lifepass:// return redirect — so unlike the email-confirmation
 * link, the custom-scheme return works on Android (the auth session intercepts
 * it instead of the browser trying to navigate to about:blank).
 */
export async function startCheckout(
  productSlug: string,
  opts?: { saveCard?: boolean },
): Promise<CheckoutOutcome> {
  const { url, externalSessionId } = await createCheckout(productSlug, opts);

  const result = await WebBrowser.openAuthSessionAsync(url, PAYMENT_SUCCESS_URL);
  if (result.type !== 'success' || !result.url) return 'canceled';
  if (result.url.includes('payment-canceled')) return 'canceled';

  // Returned via the success deep link. Trigger the server-side verified pull,
  // then fall back to status polling until fulfilment lands.
  let fulfilled = externalSessionId ? await confirmCheckout(externalSessionId) : false;
  if (!fulfilled) fulfilled = await pollPaymentStatus();
  return fulfilled ? 'fulfilled' : 'pending';
}
