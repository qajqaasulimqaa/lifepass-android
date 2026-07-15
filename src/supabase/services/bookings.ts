// Bookings + provider availability, backed by the LifePass v1 API — mirrors
// lifepass-ios Services/BookingService.swift.
//
// The old direct-Supabase access (querying `availability_slots` and inserting
// into `bookings`) is DEAD against the v1 backend: availability is a
// server-side provider facade at `/activities/{id}/availability`, and creates
// go through `POST /bookings` where the server derives venue/price/provider/
// owner/status and resolves the charge + gating. Same migration favourites.ts
// and venues.ts already went through.
import { apiGet, apiPost } from '../../api/client';
import type { Booking } from '../../types/booking';

// ─── Read shape (GET /bookings) ──────────────────────────────────────────────

// A booking as the API returns it — unified internal + provider shape.
type ApiBooking = {
  id: string;
  status: string; // pending | confirmed | checked_in | cancelled | completed | no_show
  startsAt: string;
  endsAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  venue: { id: string; slug: string; name: string };
  activity?: { id: string; name: string } | null;
  /** Snapshotted provider class name (e.g. "Hot Yoga"); null for slot bookings. */
  externalTitle?: string | null;
  location?: string | null;
};

// `GET /bookings` is paginated: the API envelope's `data` is itself
// `{ data: [...], pagination }` (same convention as `/venues`).
type BookingPage = { data: ApiBooking[]; pagination?: unknown };

// The v1 status vocabulary collapsed onto the app's 3-state model.
function adaptStatus(s: string): Booking['status'] {
  if (s === 'cancelled' || s === 'no_show') return 'canceled';
  if (s === 'completed' || s === 'checked_in') return 'completed';
  return 'confirmed'; // pending | confirmed
}

export function adaptBooking(b: ApiBooking): Booking {
  return {
    id: b.id,
    venueId: b.venue.id,
    venueName: b.venue.name,
    // The booking read shape carries no venue image; fall back to a seeded
    // placeholder (as the old adapter did when image_url was absent).
    venueImageUrl: `https://picsum.photos/seed/${b.venue.id}/600/400`,
    activityName: b.externalTitle ?? b.activity?.name ?? 'Activity',
    bookingTime: new Date(b.startsAt),
    status: adaptStatus(b.status),
    creditCost: 0, // credits are gone backend-side — premium venues are à-la-carte
    isLuxury: false,
  };
}

export async function fetchBookings(upcoming: boolean): Promise<Booking[]> {
  const page = await apiGet<BookingPage>('/bookings', {
    range: upcoming ? 'upcoming' : 'past',
    limit: 100,
  });
  return page.data.map(adaptBooking);
}

export async function fetchUpcomingBookings(limit = 5): Promise<Booking[]> {
  const page = await apiGet<BookingPage>('/bookings', { range: 'upcoming', limit });
  return page.data.map(adaptBooking);
}

// `POST /bookings/{id}/cancel` — deterministic idempotency key so a network
// retry of the same cancel can't be treated as a new operation.
export async function cancelBooking(id: string): Promise<void> {
  await apiPost(`/bookings/${id}/cancel`, { reason: null }, { idempotencyKey: `cancel-${id}` });
}

// ─── Availability (GET /activities/{id}/availability) ────────────────────────

// A bookable slot for the Time step. Carries the raw ISO `startsAt`/`endsAt`
// so create can send them back verbatim (no Date round-trip that could shift
// the instant or drop the offset).
export type BookingSlot = {
  id: string; // startsAt ISO — unique within the day
  startTime: Date;
  endTime: Date;
  startsAt: string;
  endsAt: string;
  available: boolean;
  spotsRemaining?: number;
  title?: string;
  instructor?: string;
};

type ApiAvailability = {
  activityId: string;
  provider: string;
  slots: {
    startsAt: string;
    endsAt: string;
    available: boolean;
    remainingCapacity: number | null;
    instructor: string | null;
    title: string | null;
  }[];
  fetchedAt: string;
};

// The user's LOCAL calendar day. The API (and web) key availability on the
// local day — a UTC serialization would request the wrong day for non-UTC
// users. Mirrors BookingService.ymd (timeZone = .current).
function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchAvailableSlots(
  activityId: string,
  date: Date,
): Promise<BookingSlot[]> {
  const ymd = toLocalYmd(date);
  const resp = await apiGet<ApiAvailability>(
    `/activities/${activityId}/availability`,
    { start: ymd, end: ymd, participants: 1 },
  );
  return resp.slots.map((s) => ({
    id: s.startsAt,
    startTime: new Date(s.startsAt),
    endTime: new Date(s.endsAt),
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    available: s.available,
    spotsRemaining: s.remainingCapacity ?? undefined,
    title: s.title ?? undefined,
    instructor: s.instructor ?? undefined,
  }));
}

// ─── Create (POST /bookings) + 402 charge-consent ────────────────────────────

// Slot-booking payload. On a `402 charge_consent_required`, the caller
// re-POSTs the SAME input with `acceptCharge:true` + the disclosed amount,
// REUSING the same Idempotency-Key so consenting never double-books.
export type CreateBookingInput = {
  activityId: string;
  startsAt: string;
  endsAt: string;
  acceptCharge?: boolean;
  acceptedChargeAmountIsk?: number;
};

export type CreateBookingResult = {
  bookingId: string;
  status: string;
  remainingMonthly?: number | null;
  isLastBeforeTopUp?: boolean | null;
  topUpApplied?: boolean | null;
};

export async function createBooking(
  input: CreateBookingInput,
  idempotencyKey: string,
): Promise<CreateBookingResult> {
  return apiPost<CreateBookingResult>('/bookings', input, { idempotencyKey });
}

// ─── Pay-and-save-card rail (no saved card) ──────────────────────────────────
//
// A charge-bearing booking returns `402 no_payment_method_on_file` when the
// member has no vaulted card. Instead of dead-ending, create an amount-only
// Kling hosted session (captures the surcharge AND vaults the card), open it,
// and on return confirm — a verified pull that vaults the card then runs the
// booking with the captured funds. Mirrors iOS BookingPaymentService
// (monorepo PR #70, docs/09_BOOKING_PAYMENT_SESSIONS.md).
//
// Idempotency contract: `createBookingPaymentSession` MUST reuse the SAME key
// the direct `createBooking` used, so paying-via-session and booking-directly
// can never double-book. Confirm resolves the session by that same key.

type CreateSessionResponse = {
  hasCard: boolean;
  sessionId?: string;
  externalSessionId?: string;
  url?: string;
  amountIsk?: number;
};

export type BookingPaySession =
  | { hasCard: true }
  | { hasCard: false; url: string; externalSessionId: string; amountIsk: number };

async function createPaymentSession(
  body: Record<string, unknown>,
  idempotencyKey: string,
  fallbackAmount: number,
): Promise<BookingPaySession> {
  const res = await apiPost<CreateSessionResponse>('/bookings/payment-sessions', body, {
    idempotencyKey,
  });
  if (res.hasCard) return { hasCard: true };
  if (!res.url || !res.externalSessionId) {
    // Contract violation (hasCard:false with no url) — retryable, not a no-op.
    throw new Error('Payment could not be started. Please try again.');
  }
  return {
    hasCard: false,
    url: res.url,
    externalSessionId: res.externalSessionId,
    amountIsk: res.amountIsk ?? fallbackAmount,
  };
}

export async function createBookingPaymentSession(
  input: { activityId: string; startsAt: string; endsAt: string; acceptedChargeAmountIsk: number },
  idempotencyKey: string,
): Promise<BookingPaySession> {
  return createPaymentSession(
    {
      kind: 'booking',
      activityId: input.activityId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      acceptedChargeAmountIsk: input.acceptedChargeAmountIsk,
    },
    idempotencyKey,
    input.acceptedChargeAmountIsk,
  );
}

// Walk-in variant: `venueId` is required, no start/end window, `activityId` is
// null for a venue-level walk-in. Same `/bookings/payment-sessions` endpoint
// with `kind: 'walk_in'` (server schema requires activityId to be present).
export async function createWalkInPaymentSession(
  input: { venueId: string; activityId?: string | null; acceptedChargeAmountIsk: number },
  idempotencyKey: string,
): Promise<BookingPaySession> {
  return createPaymentSession(
    {
      kind: 'walk_in',
      activityId: input.activityId ?? null,
      venueId: input.venueId,
      acceptedChargeAmountIsk: input.acceptedChargeAmountIsk,
    },
    idempotencyKey,
    input.acceptedChargeAmountIsk,
  );
}

export type BookingPayStatus =
  | 'fulfilled'
  | 'processing'
  | 'refunded'
  | 'expired'
  | 'needs_attention';

export type BookingPayConfirmation = {
  status: BookingPayStatus;
  bookingId?: string;
  checkInId?: string;
  reason?: string;
};

const PAY_STATUSES: BookingPayStatus[] = [
  'fulfilled',
  'processing',
  'refunded',
  'expired',
  'needs_attention',
];

// `POST /bookings/payment-sessions/confirm` — verified pull → card vault →
// booking, resolved by the booking idempotency key (Kling doesn't template its
// session id into the return URL). Idempotent — safe to call repeatedly. An
// unrecognized status decodes as `processing` so a new state can't read as
// success.
export async function confirmBookingPaymentSession(
  key: string,
): Promise<BookingPayConfirmation> {
  const res = await apiPost<{ status: string; bookingId?: string; checkInId?: string; reason?: string }>(
    '/bookings/payment-sessions/confirm',
    { key },
  );
  const status = (PAY_STATUSES as string[]).includes(res.status)
    ? (res.status as BookingPayStatus)
    : 'processing';
  return { status, bookingId: res.bookingId, checkInId: res.checkInId, reason: res.reason };
}
