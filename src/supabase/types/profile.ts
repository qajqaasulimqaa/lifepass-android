export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  language: string | null;
  kennitala: string | null;
  kennitala_verified_at: string | null;
};

export type ProfileUpdate = {
  full_name?: string;
  language?: string;
};

// ─── Recent check-in (staff proof) ──────────────────────────────────────────────
//
// Mirrors lifepass-ios Models/Profile.swift `RecentCheckIn`. A receipt, not a
// credential: the check-in already happened and is recorded server-side. Drives
// the "you're checked in" banner a member holds up at reception. The server owns
// the display window and simply stops sending it once it lapses — so there is no
// client-side timer. Arrives (fail-soft) on `GET /profile`; see services/profile.
export type RecentCheckIn = {
  checkInId: string;
  checkedInAt: Date;
  /** Who the check-in belongs to — staff read this first. */
  memberName: string | null;
  venue: { id: string; name: string };
  /** The booked class, when the check-in adopted a booking; null for a walk-in. */
  activity: { id: string; name: string } | null;
};

/** Last six of the check-in id, upper-cased — the same short code the web proof
 * shows, so staff comparing the two screens see one scheme. */
export function checkInConfirmationCode(c: RecentCheckIn): string {
  return c.checkInId.slice(-6).toUpperCase();
}
