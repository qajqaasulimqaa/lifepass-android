import type { Booking } from '../types/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysPast(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysAhead(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function pastLabel(date: Date): string {
  const d = daysPast(date);
  if (d === 0) return 'this morning';
  if (d === 1) return 'yesterday';
  if (d === 2) return 'two days ago';
  return 'recently';
}

function upcomingLabel(date: Date): string {
  const d = daysAhead(date);
  if (d === 0) return 'later today';
  if (d === 1) return 'tomorrow';
  return 'this week';
}

/** Derive a short human-readable label from an activity or venue name. */
function activityLabel(booking: Booking): string {
  const raw = (booking.activityName || booking.venueName).toLowerCase();
  if (/gym|weight|crossfit|mma|combat|spinning|fitness/.test(raw)) return 'Gym';
  if (/yoga|vinyasa|yin/.test(raw))                                  return 'Yoga';
  if (/pilates/.test(raw))                                           return 'Pilates';
  if (/swim|pool|lap/.test(raw))                                     return 'Swimming';
  if (/lagoon|geothermal|thermal/.test(raw))                         return 'Lagoon';
  if (/spa|sauna|steam|wellness/.test(raw))                          return 'Spa';
  if (/golf/.test(raw))                                              return 'Golf';
  // Fallback: first word of the venue name
  return booking.venueName.split(' ')[0];
}

// What to say the day after each activity
const FOLLOW_UP: Record<string, string> = {
  Gym:       'Rest and recover today.',
  Yoga:      'How are you feeling?',
  Pilates:   'Keep the momentum going.',
  Swimming:  'Time to recharge.',
  Lagoon:    'Feeling restored?',
  Spa:       'Feeling refreshed?',
  Golf:      'Back on the course soon?',
};

// ─── Coach page (2-line heading) ──────────────────────────────────────────────

export function deriveCoachHeading(
  pastBookings: Booking[],
  upcomingBookings: Booking[],
): string {
  const last = pastBookings[0];
  const next = upcomingBookings[0];

  // No activity at all
  if (!last && !next) {
    return 'Ready to explore?\nLet me find something for you.';
  }

  // Only upcoming, nothing past
  if (!last && next) {
    const label = activityLabel(next);
    const when  = upcomingLabel(next.bookingTime);
    return `${label} ${when}.\nLet's get you ready!`;
  }

  const label    = activityLabel(last!);
  const when     = pastLabel(last!.bookingTime);
  const followUp = FOLLOW_UP[label] ?? 'Today is your day.';

  // Past + upcoming → show both
  if (next) {
    const nextLabel = activityLabel(next);
    const nextWhen  = upcomingLabel(next.bookingTime);
    return `${label} ${when}.\n${nextLabel} ${nextWhen}.`;
  }

  // Only past
  return `${label} ${when}.\n${followUp}`;
}

// ─── Home page (single personalized tagline) ─────────────────────────────────

export function deriveHomeTagline(
  pastBookings: Booking[],
  upcomingBookings: Booking[],
): string | null {
  const last = pastBookings[0];
  const next = upcomingBookings[0];

  if (!last && !next) return null; // first-time user — show nothing extra

  if (!last && next) {
    const label = activityLabel(next);
    const when  = upcomingLabel(next.bookingTime);
    return `${label} ${when} — get ready.`;
  }

  const label = activityLabel(last!);
  const when  = pastLabel(last!.bookingTime);

  if (next) {
    const nextLabel = activityLabel(next);
    const nextWhen  = upcomingLabel(next.bookingTime);
    return `${label} ${when} · ${nextLabel} ${nextWhen}.`;
  }

  const followUp = FOLLOW_UP[label] ?? '';
  return `${label} ${when}. ${followUp}`.trim();
}
