import { supabase } from '../lib/client';
import { apiGet } from '../../api/client';
import type { Venue as DbVenue, Activity as DbActivity, DayHours, OpeningHours as DbOpeningHours } from '../types/venue';
import type { Venue, Activity, VenueReview, OpeningHours, OpeningHoursDay } from '../../types/venue';

// Venue reads go through the LifePass API (GET /venues), same as
// lifepass-ios VenueService.swift — the API returns resolved image URLs
// and caller-resolved ISK pricing (inBundle / surchargePrice / …).
// Reviews go through GET /venues/{id}/reviews. Activities still read the
// (live) activities table directly — see fetchActivities.

// ─── Storage ──────────────────────────────────────────────────────────────────

// Public bucket holding venue/activity images; used for activity rows,
// which still come straight from the DB with relative storage paths.
const STORAGE_BASE = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-images`;

function storageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${STORAGE_BASE}/${encoded}`;
}

// ─── API response shape (VenueSummary) ────────────────────────────────────────

type ApiDayHours = { open?: string | null; close?: string | null; closed?: boolean | null };

type ApiVenue = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  descriptionIs?: string | null;
  address?: string | null;
  city?: string | null;
  coordinates?: { latitude?: number | null; longitude?: number | null } | null;
  imageUrl?: string | null;
  categories?: string[] | null;
  category?: string | null; // singular primary category
  amenities?: string[] | null;
  phone?: string | null;
  openingHours?: Partial<Record<keyof OpeningHours, ApiDayHours | null>> | null;
  walkInsAllowed?: boolean | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  displayOrder?: number | null;
  awaitingConnection?: boolean | null;
  activitiesAwaitingConnection?: boolean | null;
  inBundle?: boolean | null;
  surchargePrice?: number | null;
  resolvedSurchargePrice?: number | null;
  topupPrice?: number | null;
  daypassPrice?: number | null;
};

type VenuePage = {
  data: ApiVenue[];
  // pagination and facets are present but unused by the shelves today
};

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptDay(d: DayHours | ApiDayHours | null | undefined): OpeningHoursDay | undefined {
  if (!d) return undefined;
  return {
    open: d.open ?? undefined,
    close: d.close ?? undefined,
    closed: d.closed ?? undefined,
  };
}

function adaptOpeningHours(
  hours: DbOpeningHours | ApiVenue['openingHours'] | null | undefined,
): OpeningHours {
  if (!hours) return {};
  return {
    monday: adaptDay(hours.monday),
    tuesday: adaptDay(hours.tuesday),
    wednesday: adaptDay(hours.wednesday),
    thursday: adaptDay(hours.thursday),
    friday: adaptDay(hours.friday),
    saturday: adaptDay(hours.saturday),
    sunday: adaptDay(hours.sunday),
  };
}

export function adaptApiVenue(api: ApiVenue): Venue {
  const inBundle = api.inBundle ?? false;
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    description: api.description ?? '',
    address: api.address ?? '',
    city: api.city ?? '',
    latitude: api.coordinates?.latitude ?? 0,
    longitude: api.coordinates?.longitude ?? 0,
    imageUrl: api.imageUrl ?? `https://picsum.photos/seed/${api.id}/800/520`,
    // Premium (out-of-bundle) venues fill the old 'luxury' slot so the
    // existing filters keep working.
    classification: inBundle ? 'basic' : 'luxury',
    category: api.categories ?? [],
    primaryCategory: api.category ?? undefined,
    // Credits are gone backend-side; kept as a placeholder until the
    // booking flow migrates to the API. Venue UI shows ISK price labels.
    creditCost: 1,
    walkInsAllowed: api.walkInsAllowed ?? false,
    walkInCreditCost: 1,
    amenities: api.amenities ?? [],
    openingHours: adaptOpeningHours(api.openingHours),
    phone: api.phone ?? '',
    averageRating: api.averageRating ?? 0,
    totalReviews: api.totalReviews ?? 0,
    activities: [],   // loaded separately via fetchActivities
    reviews: [],      // loaded separately via fetchVenueReviews
    specialInstructions: undefined,
    inBundle,
    surchargePrice: api.surchargePrice ?? undefined,
    resolvedSurchargePrice: api.resolvedSurchargePrice ?? undefined,
    topupPrice: api.topupPrice ?? undefined,
    daypassPrice: api.daypassPrice ?? undefined,
  };
}

// DB-row adapter — still used by the walk-in check-in flow, which looks
// venues up by QR-code id directly in Supabase.
export function adaptVenue(db: DbVenue): Venue {
  const inBundle = db.in_bundle ?? true;
  return {
    id: db.id,
    slug: db.slug ?? undefined,
    name: db.name,
    description: db.description ?? '',
    address: db.address ?? '',
    city: db.city ?? '',
    latitude: db.latitude ?? 0,
    longitude: db.longitude ?? 0,
    imageUrl: venueImageUrl(db) ?? `https://picsum.photos/seed/${db.id}/800/520`,
    classification: inBundle ? 'basic' : 'luxury',
    category: db.categories ?? [],
    primaryCategory: db.category ?? undefined,
    creditCost: 1,
    walkInsAllowed: db.walk_ins_allowed ?? false,
    walkInCreditCost: 1,
    amenities: db.amenities ?? [],
    openingHours: adaptOpeningHours(db.opening_hours),
    phone: db.phone ?? '',
    averageRating: db.average_rating ?? 0,
    totalReviews: db.total_reviews ?? 0,
    activities: [],
    reviews: [],
    specialInstructions: undefined,
    inBundle,
    surchargePrice: db.surcharge_price ?? undefined,
    resolvedSurchargePrice: db.member_surcharge_price ?? undefined,
    topupPrice: db.topup_price ?? undefined,
    daypassPrice: db.daypass_price ?? undefined,
  };
}

function venueImageUrl(db: DbVenue): string | undefined {
  const media = (db.venue_media ?? [])
    .filter((m) => m.active !== false && m.storage_path)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return storageUrl(media[0]?.storage_path) ?? storageUrl(db.image_path);
}

export function adaptActivity(db: DbActivity): Activity {
  return {
    id: db.id,
    name: db.name,
    imageUrl:
      db.image_url ??
      storageUrl(db.image_storage_path) ??
      `https://picsum.photos/seed/${db.id}/200/200`,
    creditCost: 1, // see adaptApiVenue — credit model moved behind the API
    durationMinutes: db.duration_minutes ?? 60,
    classification: 'basic',
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

// The API caps pages at 100; LifePass has ~40 venues, so one page is the
// whole catalogue (same assumption as the iOS shelves).
const VENUE_PAGE_LIMIT = 100;

export async function fetchVenues(opts?: {
  search?: string;
  city?: string;
}): Promise<Venue[]> {
  const page = await apiGet<VenuePage>('/venues', {
    limit: VENUE_PAGE_LIMIT,
    q: opts?.search,
    city: opts?.city,
  });
  return page.data.map(adaptApiVenue);
}

/**
 * `GET /venues` filtered to one API category — used by the Coach venue
 * wizard's result cards (mirrors iOS VenueService.fetchVenuesFromAPI).
 * The API matches the category case-insensitively against each venue's
 * `categories` array.
 */
export async function fetchVenuesFromAPI(
  category: string | null,
  limit = 20,
): Promise<Venue[]> {
  const page = await apiGet<VenuePage>('/venues', {
    limit,
    category: category ?? undefined,
  });
  return page.data.map(adaptApiVenue);
}

export async function fetchVenueBySlug(slug: string): Promise<Venue> {
  const venue = await apiGet<ApiVenue>(`/venues/by-slug/${encodeURIComponent(slug)}`);
  return adaptApiVenue(venue);
}

export async function fetchVenueById(id: string): Promise<Venue> {
  // The API has no get-by-id (detail is keyed by slug), but one page holds
  // the whole catalogue — find the venue there so callers keep their id-based
  // navigation.
  const page = await apiGet<VenuePage>('/venues', { limit: VENUE_PAGE_LIMIT });
  const match = page.data.find((v) => v.id === id);
  if (!match) throw new Error('Venue not found');
  return adaptApiVenue(match);
}

export async function fetchActivities(venueId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as DbActivity[]).map(adaptActivity);
}

// `GET /venues/{venueId}/reviews` — reviews + aggregate summary (mirrors iOS
// VenueService.fetchVenueReviews). Maps the API `rows` into the app VenueReview
// the detail view consumes. Reviews are keyed by venue UUID (not slug).
type ApiReviewsResponse = {
  rows: {
    id: string;
    venueId: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    reviewer?: { fullNameInitial?: string; fullName?: string | null };
  }[];
  canWriteReview?: boolean;
  ownReviewId?: string | null;
};

export async function fetchVenueReviews(venueId: string): Promise<VenueReview[]> {
  const resp = await apiGet<ApiReviewsResponse>(`/venues/${venueId}/reviews`);
  return resp.rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: new Date(r.createdAt),
  }));
}
