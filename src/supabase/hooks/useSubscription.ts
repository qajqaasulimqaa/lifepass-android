import { useCallback, useEffect, useState } from 'react';
import type { Subscription } from '../types/subscription';
import { fetchActiveSubscription } from '../services/subscription';

type SubscriptionState = {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSubscription(): SubscriptionState {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchActiveSubscription()
      .then(setSubscription)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { subscription, loading, error, refetch: load };
}
