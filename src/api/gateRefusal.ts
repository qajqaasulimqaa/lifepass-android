// Maps a booking / walk-in DomainError code to friendly copy + whether it's a
// membership-shaped refusal (adds a "View plans" CTA). Mirrors iOS
// BookingViewModel.gateRefusal(forCode:). Returns null for anything not a known
// gate refusal so the caller falls back to the raw error message.

export type GateRefusal = {
  title: string;
  message: string;
  /** Membership-shaped — the fix is a plan, so offer a "View plans" CTA. */
  needsMembership: boolean;
};

export function gateRefusalFor(code: string | undefined): GateRefusal | null {
  switch (code) {
    case 'no_active_plan_or_pass':
      return {
        title: 'Plan needed',
        message: 'You need an active plan or pass to book this venue.',
        needsMembership: true,
      };
    case 'boutique_requires_membership':
      return {
        title: 'Membership needed',
        message:
          "This boutique studio is only available with a monthly plan — a pass doesn't cover it.",
        needsMembership: true,
      };
    case 'daily_use_cap_reached':
      return {
        title: 'Daily limit reached',
        message:
          "You've used all your included visits for today. Premium venues are still available.",
        needsMembership: false,
      };
    case 'venue_already_booked_today':
      return {
        title: 'Already booked',
        message: 'You already have a booking at this venue today.',
        needsMembership: false,
      };
    case 'slot_already_booked':
      return {
        title: 'Already booked',
        message: "You've already booked this time slot.",
        needsMembership: false,
      };
    case 'concurrent_cap_reached':
      return {
        title: 'Too many active bookings',
        message:
          "You've reached the limit of upcoming bookings. Complete or cancel one first.",
        needsMembership: false,
      };
    default:
      return null;
  }
}
