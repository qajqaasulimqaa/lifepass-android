/**
 * Active subscription as returned by `GET /subscriptions` (or `null` when
 * none). API v1 shape — mirrors iOS Models/Subscription.swift.
 *
 * Credits and luxury were removed entirely in v1; entitlements (tier caps +
 * active passes) live on the profile `usage` block, NOT here. This model only
 * describes the recurring-plan lifecycle: which product, status, current
 * billing period, and cancellation state.
 */
export type Subscription = {
  /** Subscription row uuid — referenced by POST /subscriptions/cancel. */
  id: string;
  productSlug: string;
  productName: string;
  status: 'active' | 'past_due' | string;
  currentPeriodStartsAt: string; // ISO
  currentPeriodEndsAt: string; // ISO
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null; // ISO
};

// ─── Derived helpers (mirror the Swift computed vars) ─────────────────────────

export function isActive(sub: Subscription): boolean {
  return sub.status === 'active' || sub.status === 'past_due';
}

/** Dunning: the monthly charge failed; access is suspended until cured. */
export function isPastDue(sub: Subscription): boolean {
  return sub.status === 'past_due';
}

/** Marketing display name — prefer the API's productName, else a slug label. */
export function planDisplayName(sub: Subscription): string {
  if (sub.productName) return sub.productName;
  const map: Record<string, string> = {
    'plan-base': 'LifePass Base',
    'plan-base-annual': 'LifePass Base',
    'plan-plus': 'LifePass Plus',
    'plan-plus-annual': 'LifePass Plus',
    'plan-max': 'LifePass Max',
    'plan-max-annual': 'LifePass Max',
    'pass-explorer': 'Explorer',
    'pass-adventurer': 'Adventurer',
    'pass-local': 'Local',
  };
  return map[sub.productSlug] ?? sub.productSlug;
}
