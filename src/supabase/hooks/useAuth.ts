import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/client';
import { signIn, signUp, signOut } from '../services/auth';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

type AuthActions = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    nationality: string | undefined,
    marketingOptIn: boolean,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Keep state in sync with Supabase auth events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    loading,
    signIn: async (email, password) => {
      await signIn(email, password);
    },
    signUp: async (email, password, fullName, nationality, marketingOptIn) => {
      await signUp(email, password, fullName, nationality, marketingOptIn);
    },
    signOut: async () => {
      await signOut();
    },
  };
}
