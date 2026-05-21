/**
 * Mirrors the iOS CheckIn model. `check_ins` is the canonical attendance
 * record — every walk-in writes one, and every class attendance scan writes
 * one. The `type` discriminates which kind.
 */
export type CheckIn = {
  id: string;
  user_id: string;
  booking_id: string | null;
  venue_id: string | null;
  activity_id: string | null;
  type: 'walk_in' | 'attendance' | string;
  checkin_time: string | null;
  notes: string | null;
};

export type CheckInInsert = {
  user_id: string;
  booking_id: string | null;
  venue_id: string | null;
  activity_id: string | null;
  type: string;
  notes: string | null;
};
