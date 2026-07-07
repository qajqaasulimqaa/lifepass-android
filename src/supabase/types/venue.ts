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

// Row in `venue_media` — preferred source for venue images. Paths are
// relative to the public `venue-images` storage bucket.
export type VenueMedia = {
  storage_path: string;
  display_order: number | null;
  active: boolean | null;
};

// Matches the production (katie) schema. Differs from the legacy project:
// `active` (was `is_active`), `categories` string[] (was `category`),
// `image_path` (was `image_url`), and pricing columns replace the old
// credit/classification model.
export type Venue = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  time_zone: string | null;
  image_path: string | null;
  active: boolean;
  opening_hours: OpeningHours | null;
  categories: string[] | null;
  category: string | null; // legacy single-value column, e.g. 'studio'
  walk_ins_allowed: boolean | null;
  in_bundle: boolean | null;
  surcharge_price: number | null;
  member_surcharge_price: number | null;
  topup_price: number | null;
  daypass_price: number | null;
  phone: string | null;
  amenities: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  display_order: number | null;
  awaiting_connection: boolean | null;
  track_attendance: boolean | null;
  // present when the query embeds `venue_media(...)`
  venue_media?: VenueMedia[] | null;
};

export type Activity = {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  category: string | null;
  max_participants: number | null;
  active: boolean;
  display_order: number | null;
  image_url: string | null;
  image_storage_path: string | null;
  booking_window_days: number | null;
  booking_cutoff_hours: number | null;
  cancellation_cutoff_hours: number | null;
  facility_closed_during_class: boolean | null;
  show_max_bookings: boolean | null;
  awaiting_connection: boolean | null;
  provider: string | null;
  offers_walk_in_slots: boolean | null;
  surcharge_price: number | null;
  member_surcharge_price: number | null;
  overrides_venue_pricing: boolean | null;
  overrides_venue_category: boolean | null;
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
