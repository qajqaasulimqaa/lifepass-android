import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../lib/client';

/**
 * Mirrors iOS AuthService.swift. Email-confirmation / magic-link callbacks
 * arrive as a `lifepass://auth/callback` deep link; App.tsx forwards the URL
 * to completeAuthFromUrl() below (mirrors iOS `.onOpenURL → session(from:)`).
 */

// Flushes a pending browser auth session on app resume (no-op otherwise).
WebBrowser.maybeCompleteAuthSession();

export const AUTH_CALLBACK_URL = 'lifepass://auth/callback';

// Where Supabase sends the browser AFTER the email-confirmation link is tapped.
// We deliberately use an https lifepass.is page, NOT the lifepass:// scheme:
// Android's browser refuses to follow a redirect into a custom scheme, so the
// scheme lands on about:blank (looks like the confirmation failed). An https
// page always renders, so the user gets a real "you're on the site" moment;
// the email is confirmed server-side by then, and they return to the app and
// sign in. (iOS handles the scheme fine, but this repo is Android-only.)
export const EMAIL_CONFIRM_REDIRECT = 'https://www.lifepass.is';

// Where the OAuth browser redirect lands: `exp://<ip>:8081/--/auth/callback`
// in Expo Go dev, `lifepass://auth/callback` in real builds (scheme in
// app.json). Both patterns must be allowlisted in Supabase → Auth →
// URL Configuration → Redirect URLs.
const OAUTH_REDIRECT = makeRedirectUri({ path: 'auth/callback' });

/**
 * Google sign-in via the Supabase-hosted OAuth flow in a system browser
 * tab. Works in Expo Go (no native Google SDK needed); the redirect back
 * carries the session tokens in the URL fragment.
 *
 * Returns the session, or null if the user closed the browser sheet.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: OAUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);
  if (result.type !== 'success') return null; // user cancelled

  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) {
    throw new Error(params.error_description ?? 'Google sign-in failed. No session returned.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
  return sessionData.session;
}

/**
 * Complete a sign-in from an incoming deep link — the email-confirmation or
 * magic link redirects to `lifepass://auth/callback` with the session tokens
 * in the URL fragment. Extract them and establish the session. No-op for
 * unrelated URLs. Mirrors iOS AuthService's `.onOpenURL` → `session(from:)`.
 *
 * NOTE: the redirect only reaches here if `lifepass://auth/callback` (and
 * `lifepass://**`) are allowlisted in Supabase → Auth → URL Configuration →
 * Redirect URLs — otherwise the browser lands on about:blank.
 */
export async function completeAuthFromUrl(url: string): Promise<boolean> {
  if (!url.includes('auth/callback')) return false;
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return true;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

/**
 * Create a new account, mirroring the iOS AuthService + the website. There is
 * no signup API endpoint: Supabase owns Auth, and the `profiles` row is
 * provisioned SERVER-SIDE from this user metadata on the first authenticated
 * LifePass API call. The client performs NO app-table writes.
 *
 * Metadata shape matches iOS exactly: `full_name`, `marketing_opt_in`,
 * `signup_source` ("auth" — Android has no plan-context signup entry point),
 * and `nationality` only when present (omitted, never sent as an empty
 * string, exactly like the web form). Kennitala is NOT a signup field — it is
 * verified later through the Kenni flow and is server-owned.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  nationality: string | undefined,
  marketingOptIn: boolean,
) {
  const data: Record<string, unknown> = {
    full_name: fullName,
    marketing_opt_in: marketingOptIn,
    signup_source: 'auth',
  };
  if (nationality) data.nationality = nationality;

  const { data: result, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data,
      // https page, not the lifepass:// scheme — see EMAIL_CONFIRM_REDIRECT.
      emailRedirectTo: EMAIL_CONFIRM_REDIRECT,
    },
  });
  if (error) throw error;

  return result;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_CALLBACK_URL,
  });
  if (error) throw error;
}
