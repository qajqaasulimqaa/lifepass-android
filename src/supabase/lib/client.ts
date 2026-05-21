
//Conector to Supabase

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client singleton — shared across the whole app.
 *
 * Credentials live in .env (gitignored). Use EXPO_PUBLIC_ prefix so
 * Expo's build system inlines them at bundle time — same project as
 * lifepass-ios (SupabaseConfig.swift).
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env and fill in the values.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // must be false in React Native
  },
});
