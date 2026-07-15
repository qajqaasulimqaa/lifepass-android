// LifePass backend API client — the proxy layer in front of Supabase.
//
// Mirrors the iOS app's APIClient/APIConfig (lifepass-ios
// Services/API/*.swift): auth stays on Supabase, and every call sends
// the live session's access token as a bearer so the API can resolve
// caller-specific data (e.g. member surcharge prices). Responses are
// wrapped in an `{ ok, data }` envelope which this client unwraps.
//
// Must be the `www.` host: the apex lifepass.is 308-redirects to www,
// and the Authorization header can be dropped on cross-host redirects.
import { supabase } from '../supabase/lib/client';

const API_BASE =
  process.env.EXPO_PUBLIC_LIFEPASS_API_URL ?? 'https://www.lifepass.is/api/v1';

/**
 * The disclosed charge carried by a `402 charge_consent_required` problem.
 * The caller confirms by re-POSTing the same request with `acceptCharge:true`
 * and `acceptedChargeAmountIsk === amountIsk` (mirrors iOS ChargeConsentOffer).
 */
export type ChargeOffer = {
  kind: string; // 'surcharge' | 'topup'
  amountIsk: number;
  lane?: string;
  reason?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    /** Present on a 402 charge_consent_required — the charge to disclose. */
    public readonly offer?: ChargeOffer,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { code?: string; message?: string } | string };

async function bearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(
  path: string,
  init: {
    method: 'GET' | 'POST' | 'DELETE';
    query?: Record<string, string | number | undefined>;
    body?: unknown;
    idempotencyKey?: string;
  },
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await bearerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  // High-value writes (checkout, bookings, …) require an idempotency key so a
  // network retry can't double-charge; the server caches the first result.
  if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;

  const res = await fetch(url.toString(), {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  let body: Envelope<T> | undefined;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    // fall through to the status check below
  }

  if (!res.ok || !body || body.ok !== true) {
    // Two error shapes: the app envelope `{ ok: false, error }` and RFC-7807
    // problem-details (`{ type, title, status, detail }`) that /api/v1 uses.
    // For problem-details, `title` is the machine code (e.g.
    // "kennitala_verification_required") and `detail` is the human message.
    const envErr = body && body.ok === false ? body.error : undefined;
    const problem = body as any;
    const message =
      (typeof envErr === 'string' ? envErr : envErr?.message) ??
      (typeof problem?.detail === 'string' ? problem.detail : undefined) ??
      (typeof problem?.title === 'string' ? problem.title : undefined) ??
      `API request failed (${res.status})`;
    const code =
      (typeof envErr === 'object' ? envErr?.code : undefined) ??
      (typeof problem?.title === 'string' ? problem.title : undefined);
    // A 402 charge_consent_required carries the disclosed charge as `offer`.
    const offer =
      problem && typeof problem.offer === 'object' && problem.offer !== null
        ? (problem.offer as ChargeOffer)
        : undefined;
    throw new ApiError(message, res.status, code, offer);
  }

  return body.data;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'GET', query });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  opts?: { idempotencyKey?: string },
): Promise<T> {
  return request<T>(path, { method: 'POST', body, idempotencyKey: opts?.idempotencyKey });
}

export async function apiDelete<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'DELETE', query });
}
