export type DayHours = {
  open: string | null;
  close: string | null;
  closed: boolean | null;
};

export type OpeningHours = {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
};

export type Venue = {
  id: string;
  name: string;
  description: string | null;
  description_is: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
  opening_hours: OpeningHours | null;
  category: string[] | null;
  walk_ins_allowed: boolean | null;
  walk_in_credit_cost: number | null;
  classification: string | null;   // 'basic' | 'luxury'
  phone: string | null;
  amenities: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  display_order: number | null;
  special_instructions: string | null;
  awaiting_connection: boolean | null;
  track_attendance: boolean | null;
};

export type Activity = {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  description_is: string | null;
  duration_minutes: number | null;
  credit_cost: number | null;
  credit_type: string | null;
  classification: string | null;   // 'basic' | 'luxury'
  category: string[] | null;
  max_participants: number | null;
  is_active: boolean;
  display_order: number | null;
  image_url: string | null;
  booking_start_time: string | null;
  booking_end_time: string | null;
  booking_cutoff_hours: number | null;
  cancellation_cutoff_hours: number | null;
  facility_closed_during_class: boolean | null;
  show_max_bookings: boolean | null;
  awaiting_connection: boolean | null;
  external_activity_id: string | null;
  // schedule / class_times are flexible JSON — keep as unknown
  schedule: unknown;
  class_times: unknown;
};

export type VenueReview = {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
};
