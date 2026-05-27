import { supabase } from '../lib/client';
import type { Venue as DbVenue, Activity as DbActivity, VenueReview as DbVenueReview, DayHours, OpeningHours as DbOpeningHours } from '../types/venue';
import type { Venue, Activity, OpeningHours, OpeningHoursDay } from '../../types/venue';

// ─── Adapter — DB snake_case → app camelCase ──────────────────────────────────

function adaptDay(d: DayHours | null | undefined): OpeningHoursDay | undefined {
  if (!d) return undefined;
  return {
    open: d.open ?? undefined,
    close: d.close ?? undefined,
    closed: d.closed ?? undefined,
  };
}

function adaptOpeningHours(dbHours: DbOpeningHours | null | undefined): OpeningHours {
  if (!dbHours) return {};
  return {
    monday: adaptDay(dbHours.monday),
    tuesday: adaptDay(dbHours.tuesday),
    wednesday: adaptDay(dbHours.wednesday),
    thursday: adaptDay(dbHours.thursday),
    friday: adaptDay(dbHours.friday),
    saturday: adaptDay(dbHours.saturday),
    sunday: adaptDay(dbHours.sunday),
  };
}

export function adaptVenue(db: DbVenue): Venue {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? '',
    address: db.address ?? '',
    city: db.city ?? '',
    latitude: db.latitude ?? 0,
    longitude: db.longitude ?? 0,
    imageUrl: db.image_url ?? `https://picsum.photos/seed/${db.id}/800/520`,
    classification: (db.classification ?? 'basic') as 'basic' | 'luxury',
    category: db.category ?? [],
    creditCost: db.walk_in_credit_cost ?? 1,
    walkInsAllowed: db.walk_ins_allowed ?? false,
    walkInCreditCost: db.walk_in_credit_cost ?? 1,
    amenities: db.amenities ?? [],
    openingHours: adaptOpeningHours(db.opening_hours),
    phone: db.phone ?? '',
    averageRating: db.average_rating ?? 0,
    totalReviews: db.total_reviews ?? 0,
    activities: [],   // loaded separately via fetchActivities
    reviews: [],      // loaded separately via fetchVenueReviews
    specialInstructions: db.special_instructions ?? undefined,
  };
}

export function adaptActivity(db: DbActivity): Activity {
  return {
    id: db.id,
    name: db.name,
    imageUrl: db.image_url ?? `https://picsum.photos/seed/${db.id}/200/200`,
    creditCost: db.credit_cost ?? 1,
    durationMinutes: db.duration_minutes ?? 60,
    classification: (db.classification ?? 'basic') as 'basic' | 'luxury',
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function fetchVenues(opts?: {
  search?: string;
  city?: string;
}): Promise<Venue[]> {
  let query = supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);

  if (opts?.search) {
    const escaped = opts.search.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike('name', `%${escaped}%`);
  }

  if (opts?.city) {
    query = query.eq('city', opts.city);
  }

  const { data, error } = await query.order('display_order', { ascending: true });
  if (error) throw error;
  return (data as DbVenue[]).map(adaptVenue);
}

// ── Coach Q&A → real DB venues ────────────────────────────────────────────────

// Maps Q&A category key → DB category tags (any overlap = match)
const CATEGORY_TAGS: Record<string, string[]> = {
  gym:       ['Fitness', 'Gym'],
  lagoon:    ['Lagoon', 'Wellness'],
  yoga:      ['Yoga', 'Fitness', 'Pilates'],
  swimming:  ['Swimming', 'Pool'],
  spa:       ['Wellness', 'Spa', 'Sauna'],
};

// Maps region chip value → DB city names (used with Supabase .in())
const REGION_CITIES: Record<string, string[]> = {
  south: ['Reykjavík', 'Kópavogur', 'Hafnarfjörður', 'Garðabær', 'Mosfellsbær',
          'Keflavík', 'Selfoss', 'Hveragerði', 'Vík', 'Grindavík'],
  north: ['Akureyri', 'Húsavík', 'Sauðárkrókur', 'Dalvík', 'Siglufjörður'],
  east:  ['Egilsstaðir', 'Eskifjörður', 'Neskaupstaður', 'Seyðisfjörður'],
  west:  ['Borgarnes', 'Akranes', 'Ísafjörður', 'Stykkishólmur', 'Snæfellsbær'],
};

// Haversine great-circle distance in km
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchVenuesByCoachQuery(
  category: string,
  locationAnswer: string,
  userCoords?: { latitude: number; longitude: number },
): Promise<Venue[]> {
  const tags = CATEGORY_TAGS[category] ?? [];
  const isCloseby = locationAnswer === '__closeby__';

  let query = supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);

  // Supabase `.overlaps` = array has at least one element in common
  if (tags.length > 0) {
    query = query.overlaps('category', tags);
  }

  if (!isCloseby) {
    const cities = REGION_CITIES[locationAnswer];
    if (cities && cities.length > 0) {
      query = query.in('city', cities);
    }
    // 'anywhere' or unrecognised value → no city filter
  }

  // Fetch more when we'll sort by proximity so we have enough to trim from
  const fetchLimit = isCloseby ? 20 : 4;
  const { data, error } = await query
    .order('display_order', { ascending: true })
    .limit(fetchLimit);

  if (error) throw error;
  const venues = (data as DbVenue[]).map(adaptVenue);

  // When "Close by" selected: sort by Haversine distance, return nearest 4
  if (isCloseby && userCoords) {
    venues.sort((a, b) => {
      const da = haversineKm(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
      const db = haversineKm(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
      return da - db;
    });
    return venues.slice(0, 4);
  }

  return venues;
}

export async function fetchVenueById(id: string): Promise<Venue> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return adaptVenue(data as DbVenue);
}

export async function fetchActivities(venueId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as DbActivity[]).map(adaptActivity);
}

export async function fetchVenueReviews(venueId: string) {
  const { data, error } = await supabase
    .from('venue_reviews')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as DbVenueReview[];
}
