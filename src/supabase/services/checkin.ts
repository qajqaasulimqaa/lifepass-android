// Walk-in check-ins, backed by the LifePass v1 API — mirrors lifepass-ios
// Services/CheckInService.swift.
//
// The old direct-Supabase path (venues/activities/check_ins tables + the
// `spend_credits` RPC) is DEAD against the v1 backend: the server owns provider
// routing, lane/cap accounting and à-la-carte pricing. The client just POSTs
// the walk-in and, for a charge-bearing venue, discloses + confirms the charge.
// Same migration bookings.ts / favourites.ts / venues.ts already went through.
import * as Crypto from 'expo-crypto';
import { apiPost } from '../../api/client';

// ─── Errors ───────────────────────────────────────────────────────────────────
// Kept for the one client-side guard (empty/invalid QR). Server errors now
// arrive as ApiError and are handled by the screen.

export type CheckInErrorCode = 'invalid_qr' | 'unknown';

export class CheckInError extends Error {
  code: CheckInErrorCode;
  constructor(code: CheckInErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'CheckInError';
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

// v1 carries no credit/luxury numbers — the success screen shows venue,
// activity and time only.
export type WalkInResult = {
  checkInId: string;
  venueName: string;
  activityName?: string;
  checkedInAt?: string;
  /** Cap lane the visit counted against (network | pool | surcharge | …). */
  countedAgainst?: string;
};

type CheckInResponse = {
  checkInId: string;
  bookingId?: string;
  source?: string;
  countedAgainst?: string;
  checkedInAt?: string;
  venue?: { id: string; slug?: string; name: string };
  activity?: { id: string; name: string };
};

// ─── Walk-in check-in (POST /check-ins/walk-in) ──────────────────────────────
//
// A charge-bearing walk-in (à-la-carte venue) returns `402
// charge_consent_required` carrying an `offer` unless `acceptCharge:true` +
// `acceptedChargeAmountIsk` are sent. The caller discloses the offer, gets
// consent, then re-POSTs the SAME body REUSING the same idempotency key.
export async function walkInCheckIn(
  venueId: string,
  opts?: {
    acceptCharge?: boolean;
    acceptedChargeAmountIsk?: number;
    idempotencyKey?: string;
  },
): Promise<WalkInResult> {
  if (!venueId) {
    throw new CheckInError('invalid_qr', 'Invalid QR code. Please scan a LifePass venue QR code.');
  }
  const res = await apiPost<CheckInResponse>(
    '/check-ins/walk-in',
    {
      venueId,
      ...(opts?.acceptCharge
        ? { acceptCharge: true, acceptedChargeAmountIsk: opts.acceptedChargeAmountIsk }
        : {}),
    },
    { idempotencyKey: opts?.idempotencyKey ?? Crypto.randomUUID() },
  );
  return {
    checkInId: res.checkInId,
    venueName: res.venue?.name ?? 'Venue',
    activityName: res.activity?.name,
    checkedInAt: res.checkedInAt,
    countedAgainst: res.countedAgainst,
  };
}
