/**
 * Mirrors the iOS Subscription model exactly.
 *
 * Credit balance: always sum remaining_basic_credits + remaining_luxury_credits.
 * The top-level remaining_credits column is NOT consistently maintained by all
 * server code paths — same warning as in SubscriptionService.swift.
 */
export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  mode: string | null;
  status: string;
  tier: string | null;

  // Credit buckets — source of truth for balance
  remaining_basic_credits: number | null;
  remaining_luxury_credits: number | null;
  remaining_credits: number | null;   // stale — do not use as balance
  credits_granted: number | null;

  // Luxury visit tracking
  luxury_visits_used: number | null;
  luxury_visit_cap: number | null;    // null = no luxury access (S/M) or uncapped (tourist)

  // Period & expiry
  current_period_start: string | null;
  current_period_end: string | null;
  expires_at: string | null;
  commitment_months: number | null;
  commitment_end_date: string | null;
  cancel_at_period_end: boolean | null;
  package_kind: string | null;
  provider: string | null;

  // Company benefit layer
  company_credits_granted_total: number | null;
  company_remaining_basic_credits: number | null;
  company_remaining_luxury_credits: number | null;
  company_credits_last_granted_month: string | null;
};

// ─── Derived helpers (mirrors Swift computed vars) ────────────────────────────

export function totalCredits(sub: Subscription): number {
  return (sub.remaining_basic_credits ?? 0) + (sub.remaining_luxury_credits ?? 0);
}

export function isTouristPackage(sub: Subscription): boolean {
  if (sub.mode === 'one_time') return true;
  if (sub.package_kind === 'tourist') return true;
  return ['starter', 'explorer', 'wellness', 'ultimate'].includes(sub.plan);
}

export function hasLuxuryAccess(sub: Subscription): boolean {
  if (isTouristPackage(sub)) return true;
  if (sub.luxury_visit_cap != null) return true;
  const letter = tierLetter(sub);
  return letter != null && ['L', 'XL'].includes(letter);
}

export function tierLetter(sub: Subscription): string | null {
  if (sub.tier) return sub.tier.toUpperCase();
  const map: Record<string, string> = {
    'plan-s': 'S', 'plan-m': 'M', 'plan-l': 'L', 'plan-xl': 'XL',
  };
  return map[sub.plan] ?? null;
}

export function planDisplayName(sub: Subscription): string {
  const map: Record<string, string> = {
    // v1 product slugs (same labels as iOS Subscription.swift)
    'plan-base': 'LifePass Base',
    'plan-base-annual': 'LifePass Base',
    'plan-plus': 'LifePass Plus',
    'plan-plus-annual': 'LifePass Plus',
    'plan-max': 'LifePass Max',
    'plan-max-annual': 'LifePass Max',
    'pass-explorer': 'Explorer',
    'pass-adventurer': 'Adventurer',
    'pass-local': 'Local',
    // legacy slugs — still in old subscription rows
    starter: 'LayOver',
    explorer: 'Week Warrior',
    wellness: 'Extended Stay',
    ultimate: 'Becoming a Local',
    'plan-s': 'Plan S',
    'plan-m': 'Plan M',
    'plan-l': 'Plan L',
    'plan-xl': 'Plan XL',
  };
  return map[sub.plan] ?? sub.plan;
}

export function hasCompanyBenefit(sub: Subscription): boolean {
  return (
    (sub.company_credits_granted_total ?? 0) > 0 ||
    (sub.company_remaining_basic_credits ?? 0) > 0 ||
    (sub.company_remaining_luxury_credits ?? 0) > 0
  );
}
