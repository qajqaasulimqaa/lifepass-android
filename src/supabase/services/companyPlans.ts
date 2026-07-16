// Employer co-pay (company plans), backed by the LifePass v1 API — mirrors
// lifepass-ios SubscriptionService company-plan methods. See the monorepo
// docs/10_COPAY_COMPANY_PLANS.md for the model: the company subsidises part of
// the membership and the member pays the remaining monthly share, auto-charged
// on a vaulted card. The member's only choice is to accept the pre-set package.
import * as Crypto from 'expo-crypto';
import { apiGet, apiPost } from '../../api/client';

// Same consent versions the checkout sends (see payments.ts) — the activation
// consent is the recurring-charge mandate.
const TERMS_VERSION = '2026-07-v1';
const PRIVACY_VERSION = '2026-07-v1';

// ─── Context (GET /company-plans/context) ────────────────────────────────────

export type PendingActivation = {
  membershipId: string;
  companyName: string;
  productSlug: string;
  productName: string;
  memberPriceIsk: number;
  subsidyIsk: number;
  /** Monthly share = max(0, price − subsidy). 0 → activation provisions instantly. */
  shareIsk: number;
  /** "existing_subscription" when a live personal sub blocks activation. */
  blocked?: string | null;
};

export type CompanyPlanContext = {
  /** An unclaimed invitation — claimed via the Kenni identity flow. */
  pendingInvite?: { companyName: string } | null;
  /** A co-pay membership awaiting the member's acceptance. */
  pendingActivation?: PendingActivation | null;
};

export async function fetchCompanyPlanContext(): Promise<CompanyPlanContext> {
  return apiGet<CompanyPlanContext>('/company-plans/context');
}

// ─── Activate (POST /company-plans/activate) ─────────────────────────────────

export type CopayActivation =
  | { kind: 'provisioned' }
  | { kind: 'checkout'; checkoutUrl: string; shareIsk: number; externalSessionId?: string };

// Accept the co-pay plan. A FRESH idempotency key per tap — reusing one replays
// a possibly-dead Kling URL. `provisioned` (subsidy covers the price) needs no
// card; `checkout` opens the hosted page for the member's monthly share.
export async function activateCompanyPlan(membershipId: string): Promise<CopayActivation> {
  const res = await apiPost<{
    kind: string;
    checkoutUrl?: string;
    shareIsk?: number;
    externalSessionId?: string;
  }>(
    '/company-plans/activate',
    {
      membershipId,
      terms: {
        acceptedAt: new Date().toISOString(),
        privacyVersion: PRIVACY_VERSION,
        termsVersion: TERMS_VERSION,
      },
    },
    { idempotencyKey: Crypto.randomUUID() },
  );
  if (res.kind === 'provisioned') return { kind: 'provisioned' };
  if (!res.checkoutUrl) {
    throw new Error('Activation could not be started. Please try again.');
  }
  return {
    kind: 'checkout',
    checkoutUrl: res.checkoutUrl,
    shareIsk: res.shareIsk ?? 0,
    externalSessionId: res.externalSessionId,
  };
}

// ─── Dunning self-cure (POST /company-plans/retry-payment) ───────────────────

export type CopayRetry = { checkoutUrl: string; shareIsk: number; externalSessionId?: string };

// Self-cure a past_due CO-PAY subscription — the server mints a fresh Kling
// hosted checkout for the member's monthly share. A personal (Kling-billed)
// past_due sub 404s here (`copay_subscription_not_found`); Kling's own dunning
// cures those, so the caller shows "we'll retry automatically" instead.
export async function retryCopayPayment(subscriptionId: string): Promise<CopayRetry> {
  const res = await apiPost<{ checkoutUrl: string; shareIsk: number; externalSessionId?: string }>(
    '/company-plans/retry-payment',
    { subscriptionId },
    { idempotencyKey: Crypto.randomUUID() },
  );
  return {
    checkoutUrl: res.checkoutUrl,
    shareIsk: res.shareIsk,
    externalSessionId: res.externalSessionId,
  };
}
