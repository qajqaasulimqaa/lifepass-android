import { supabase } from '../lib/client';
import type { Subscription } from '../types/subscription';

/**
 * Always filters by user_id explicitly — mirrors the iOS
 * SubscriptionService comment: admins can SELECT all rows via RLS,
 * so an RLS-only query on an admin account returns someone else's
 * subscription. The explicit eq('user_id', ...) is the fix.
 */
export async function fetchActiveSubscription(): Promise<Subscription | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const sub = data[0] as Subscription;

  // Belt-and-suspenders expiry check (server should handle this too)
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return null;

  return sub;
}

export async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Subscription[];
}
