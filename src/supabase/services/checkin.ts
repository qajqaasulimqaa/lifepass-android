import { supabase } from '../lib/client';
import { fetchActiveSubscription } from './subscription';
import { adaptVenue } from './venues';
import type { Venue as DbVenue, Activity as DbActivity } from '../types/venue';
import type { Venue } from '../../types/venue';
import { totalCredits, hasLuxuryAccess } from '../types/subscription';
import type { CheckInInsert } from '../types/checkin';

// ─── Errors ───────────────────────────────────────────────────────────────────
// Mirrors iOS CheckInError. We expose a stable `code` so the UI can branch
// behaviour without parsing message strings.

export type CheckInErrorCode =
  | 'not_authenticated'
  | 'invalid_qr'
  | 'venue_not_found'
  | 'walk_ins_not_allowed'
  | 'no_subscription'
  | 'insufficient_credits'
  | 'luxury_access_required'
  | 'luxury_cap_reached'
  | 'venue_usage_limit_reached'
  | 'daily_limit_reached'
  | 'unknown';

export class CheckInError extends Error {
  code: CheckInErrorCode;
  constructor(code: CheckInErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'CheckInError';
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

export type WalkInResult = {
  venue: Venue;
  creditsCharged: number;
  remainingBalance: number;
  isLuxury: boolean;
};

// ─── Walk-in check-in ─────────────────────────────────────────────────────────
//
// Mirrors CheckInService.swift -> walkInCheckIn(...).
//
// Server-side, the `spend_credits` RPC writes the credit_transactions ledger
// atomically with the balance decrement and the luxury_visits_used bump.
// We MUST NOT write credit_transactions from the client — the ledger
// invariant is enforced server-side.

export async function walkInCheckIn(venueId: string): Promise<WalkInResult> {
  // 0. Auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new CheckInError('not_authenticated', 'You need to be signed in to check in.');
  }
  const userId = user.id;

  if (!venueId) {
    throw new CheckInError('invalid_qr', 'Invalid QR code. Please scan a LifePass venue QR code.');
  }

  // 1. Venue must exist and be active
  const { data: venueRows, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .eq('is_active', true)
    .limit(1);
  if (venueError) throw venueError;
  const dbVenue = (venueRows ?? [])[0] as DbVenue | undefined;
  if (!dbVenue) {
    throw new CheckInError('venue_not_found', 'Venue not found. This QR code may be outdated.');
  }
  const venue = adaptVenue(dbVenue);

  // 2. Active subscription required
  const subscription = await fetchActiveSubscription();
  if (!subscription) {
    throw new CheckInError(
      'no_subscription',
      'No active subscription. Please purchase a plan to check in.',
    );
  }

  // 3. Pick the activity to charge against (first active one).
  //    iOS: if venue has 1 activity it auto-selects; if 0 it falls back to
  //    venue.walk_in_credit_cost. We follow the same rule, picking the first
  //    activity when there are multiple — the activity-picker UX is a
  //    future addition.
  const { data: activityRows, error: activityError } = await supabase
    .from('activities')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1);
  if (activityError) throw activityError;
  const firstActivity = (activityRows ?? [])[0] as DbActivity | undefined;

  let creditCost: number;
  let isLuxury: boolean;
  let activityId: string | null;
  let reason: string;

  if (firstActivity) {
    creditCost = firstActivity.credit_cost ?? 0;
    isLuxury = (firstActivity.classification ?? '').toLowerCase() === 'luxury';
    activityId = firstActivity.id;
    reason = `Walk-in: ${firstActivity.name}`;
  } else {
    creditCost = venue.walkInCreditCost;
    isLuxury = venue.classification === 'luxury';
    activityId = null;
    reason = `Walk-in: ${venue.name}`;
  }

  // 4. Pre-check credits (server also enforces this; client check produces
  //    a clearer error message before the round trip).
  const available = totalCredits(subscription);
  if (available < creditCost) {
    throw new CheckInError(
      'insufficient_credits',
      `Insufficient credits. You need ${creditCost} credits but have ${available} available.`,
    );
  }

  // 5. Luxury gate
  if (isLuxury) {
    if (!hasLuxuryAccess(subscription)) {
      throw new CheckInError(
        'luxury_access_required',
        'Luxury venues require Plan L or XL. Upgrade your subscription to continue.',
      );
    }
    const cap = subscription.luxury_visit_cap;
    const used = subscription.luxury_visits_used ?? 0;
    if (cap != null && used >= cap) {
      throw new CheckInError(
        'luxury_cap_reached',
        "You've used all your luxury visits this month. Basic venues are still open.",
      );
    }
  }

  // 6. Insert the check-in row so we have an id to reference from the ledger.
  const insert: CheckInInsert = {
    user_id: userId,
    booking_id: null,
    venue_id: venueId,
    activity_id: activityId,
    type: 'walk_in',
    notes: null,
  };
  const { data: inserted, error: insertError } = await supabase
    .from('check_ins')
    .insert(insert)
    .select('id')
    .single();
  if (insertError) throw insertError;
  const checkInId = (inserted as { id: string }).id;

  // 7. Spend credits atomically via the server RPC. The 8-arg signature is
  //    intentional — it lets Postgres write the credit_transactions ledger
  //    row in the same transaction. Returns the new balance (int).
  const { data: newBalance, error: rpcError } = await supabase.rpc('spend_credits', {
    p_user_id: userId,
    p_amount: creditCost,
    p_luxury_only: isLuxury,
    p_reason: reason,
    p_venue_id: venueId,
    p_activity_id: activityId,
    p_booking_id: null,
    p_check_in_id: checkInId,
  });
  if (rpcError) {
    // The RPC may reject for the same reasons we pre-checked (race condition,
    // concurrent spend, etc). Surface its message rather than our generic one.
    throw new CheckInError('unknown', rpcError.message);
  }

  return {
    venue,
    creditsCharged: creditCost,
    // Server-authoritative remaining balance. Don't compute locally.
    remainingBalance: typeof newBalance === 'number' ? newBalance : available - creditCost,
    isLuxury,
  };
}
