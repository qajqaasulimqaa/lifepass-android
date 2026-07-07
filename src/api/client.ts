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

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
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
    const err = body && body.ok === false ? body.error : undefined;
    const message =
      (typeof err === 'string' ? err : err?.message) ??
      `API request failed (${res.status})`;
    const code = typeof err === 'object' ? err?.code : undefined;
    throw new ApiError(message, res.status, code);
  }

  return body.data;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'GET', query });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body });
}

export async function apiDelete<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'DELETE', query });
}
