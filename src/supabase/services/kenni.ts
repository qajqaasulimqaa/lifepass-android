// Kenni (kenni.is) national-ID verification — mirrors iOS KenniService +
// KenniVerificationView. Monthly plans require a verified kennitala; the
// backend enforces it (403 kennitala_verification_required on subscription
// checkout). Passes never need it.
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { apiPost } from '../../api/client';

// The redirect the Kenni hosted session lands on; openAuthSessionAsync
// captures it. It is embedded server-side in the authorizationUrl the start
// endpoint returns (and must be allowlisted there) — do not build it here.
const KENNI_CALLBACK = 'lifepass://kenni-callback';

type StartResponse = { alreadyVerified: boolean; authorizationUrl?: string };
type CompleteResponse = { verified?: boolean; kennitalaVerified?: boolean };

export type KenniOutcome = 'verified' | 'cancelled';

/**
 * Native Kenni flow, mirroring iOS:
 *   1. POST /auth/kenni/start { platform: 'native' } → `alreadyVerified`, or an
 *      `authorizationUrl` embedding the lifepass://kenni-callback redirect.
 *   2. Open it in a Chrome Custom Tab (openAuthSessionAsync) and capture
 *      lifepass://kenni-callback?code=…&state=… (the auth session intercepts
 *      the custom-scheme redirect, so this works on Android).
 *   3. POST /auth/kenni/complete { code, state } → stamps kennitala_verified_at.
 * Returns 'verified' or 'cancelled' (user closed the sheet); throws otherwise.
 */
export async function runKenniVerification(): Promise<KenniOutcome> {
  const start = await apiPost<StartResponse>('/auth/kenni/start', { platform: 'native' });
  if (start.alreadyVerified) return 'verified';
  if (!start.authorizationUrl) {
    throw new Error('Could not start identity verification. Please try again.');
  }

  const result = await WebBrowser.openAuthSessionAsync(start.authorizationUrl, KENNI_CALLBACK);
  if (result.type !== 'success' || !result.url) return 'cancelled';

  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) throw new Error(errorCode);
  const { code, state } = params;
  if (!code || !state) {
    throw new Error('Verification was not completed. Please try again.');
  }

  const res = await apiPost<CompleteResponse>('/auth/kenni/complete', { code, state });
  const verified = res.kennitalaVerified ?? res.verified ?? false;
  if (!verified) throw new Error('Verification was not completed. Please try again.');
  return 'verified';
}
