import type { Venue } from './venue';
import type { Activity } from './venue';

export type Booking = {
  id: string;
  user_id: string;
  activity_id: string;
  booking_time: string;
  status: string;           // 'confirmed' | 'canceled' | 'completed'
  credit_type: string | null;
  notes: string | null;
  checkin_type: string | null;
  external_provider: string | null;
  external_booking_id: string | null;
  sync_status: string | null;
  created_at: string | null;
};

export type BookingInsert = {
  activity_id: string;
  booking_time: string;
  credit_type: string;
  status: string;
};

/** Minimal venue shape returned inside a booking join */
export type VenueSummary = {
  id: string;
  name: string;
  address: string | null;
  classification: string | null;
  image_url: string | null;
  track_attendance: boolean | null;
};

/** Activity shape returned inside a booking join */
export type ActivityWithVenue = {
  id: string;
  name: string;
  duration_minutes: number | null;
  credit_cost: number | null;
  credit_type: string | null;
  classification: string | null;
  image_url: string | null;
  venues: VenueSummary | null;
};

/**
 * Booking row with nested activity + venue — returned by the
 * select query that uses the join string from BookingService.swift:
 * "*, activities(id, name, ..., venues(id, name, ...))"
 */
export type BookingWithDetails = {
  id: string;
  user_id: string;
  activity_id: string;
  booking_time: string;
  status: string;
  credit_type: string | null;
  checkin_type: string | null;
  notes: string | null;
  external_provider: string | null;
  external_booking_id: string | null;
  created_at: string | null;
  activities: ActivityWithVenue | null;
};

export type AvailabilitySlot = {
  id: string;
  activity_id: string;
  start_time: string;
  end_time: string | null;
  is_available: boolean;
  spots_remaining: number | null;
};
