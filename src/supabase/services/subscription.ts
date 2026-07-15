// Recurring subscription, backed by the LifePass v1 API — mirrors lifepass-ios
// Services/SubscriptionService.swift.
//
// The old `.from('subscriptions')` table read is dead against v1 (it exposed
// credit/luxury columns that no longer exist). `GET /subscriptions` returns the
// current active/past_due plan or null; entitlements live on the profile
// `usage` block, not here.
import { apiGet } from '../../api/client';
import type { Subscription } from '../types/subscription';

/** `GET /subscriptions` — the current recurring plan, or null when none. */
export async function fetchActiveSubscription(): Promise<Subscription | null> {
  return apiGet<Subscription | null>('/subscriptions');
}
