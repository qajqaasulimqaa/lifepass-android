import { supabase } from '../lib/client';

/**
 * Mirrors iOS AuthService.swift.
 * Deep-link handling (email confirmation) is wired in App.tsx via
 * Expo's Linking API — see auth callback URL below.
 */

export const AUTH_CALLBACK_URL = 'lifepass://auth/callback';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  kennitala?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: AUTH_CALLBACK_URL,
    },
  });
  if (error) throw error;

  // Write kennitala to profile row if supplied and session exists
  // (no session = email confirmation required, will be retried post-verify)
  if (kennitala?.trim() && data.session) {
    await writeKennitala(kennitala.trim(), data.session.user.id);
  }

  return data;
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

/** Write unverified kennitala to the profile row. */
async function writeKennitala(kennitala: string, userId: string) {
  await supabase
    .from('profiles')
    .update({ kennitala })
    .eq('user_id', userId);
}
