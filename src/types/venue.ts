export type VenueClassification = 'basic' | 'luxury';

export interface OpeningHoursDay {
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface OpeningHours {
  monday?: OpeningHoursDay;
  tuesday?: OpeningHoursDay;
  wednesday?: OpeningHoursDay;
  thursday?: OpeningHoursDay;
  friday?: OpeningHoursDay;
  saturday?: OpeningHoursDay;
  sunday?: OpeningHoursDay;
}

export interface Activity {
  id: string;
  name: string;
  imageUrl: string;
  creditCost: number;
  durationMinutes: number;
  classification: VenueClassification;
}

export interface VenueReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Venue {
  id: string;
  /** URL slug — the API's canonical venue identifier (GET /venues/by-slug/{slug}). */
  slug?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  classification: VenueClassification;
  category: string[];
  /** Singular primary category ('gym'/'pool'/'boutique'/…) — drives boutique detection. */
  primaryCategory?: string;
  creditCost: number;
  walkInsAllowed: boolean;
  walkInCreditCost: number;
  amenities: string[];
  openingHours: OpeningHours;
  phone: string;
  averageRating: number;
  totalReviews: number;
  activities: Activity[];
  reviews: VenueReview[];
  specialInstructions?: string;

  // ── v1 pricing (per-activity-pricing model, same as lifepass-ios) ──
  // The credit wallet + luxury classification were removed backend-side.
  // Venues are either inside the tier bundle (free within the monthly cap)
  // or premium (à-la-carte surcharge).

  /** Inside the tier bundle (free within cap). Premium venues are false. */
  inBundle: boolean;
  /** Premium venue's standard "from" price (ISK). Absent for in-bundle. */
  surchargePrice?: number;
  /** Surcharge resolved for THIS caller (member discount applied server-side). */
  resolvedSurchargePrice?: number;
  /** Secondary prices for in-bundle venues (ISK). */
  topupPrice?: number;
  daypassPrice?: number;
}

// ── Pricing display helpers — mirror lifepass-ios Venue.swift ──────────────

type PricedVenue = Pick<
  Venue,
  'inBundle' | 'surchargePrice' | 'resolvedSurchargePrice' | 'topupPrice' | 'daypassPrice' | 'primaryCategory'
>;

/** Premium = charged à-la-carte (not in the bundle). */
export function isPremium(v: PricedVenue): boolean {
  return !v.inBundle;
}

/**
 * Boutiques are in-bundle but tier-capped with a small allowance, so
 * "Included" oversells them (matches the web/iOS boutique special-case).
 */
export function isBoutique(v: PricedVenue): boolean {
  return v.primaryCategory?.toLowerCase() === 'boutique';
}

/** Customer-facing ISK price, prefix form — "ISK 1,234" (en-US grouping). */
export function iskPrefix(value: number): string {
  return `ISK ${value.toLocaleString('en-US')}`;
}

/**
 * Primary pricing label for cards/pills: premium → "from ISK X" (or
 * "See venue" when no surcharge is configured); boutique → "Limited
 * visits"; other in-bundle → "Included".
 */
export function priceLabel(v: PricedVenue): string {
  if (isPremium(v)) {
    const p = v.resolvedSurchargePrice ?? v.surchargePrice;
    return p != null ? `from ${iskPrefix(p)}` : 'See venue';
  }
  if (isBoutique(v)) return 'Limited visits';
  return 'Included';
}

/**
 * Optional faint secondary line beneath priceLabel: boutique → "Extra
 * visits from ISK X"; in-bundle → "Top-up from ISK X" (or day pass);
 * premium → none.
 */
export function priceSecondaryLabel(v: PricedVenue): string | undefined {
  if (isPremium(v)) return undefined;
  if (isBoutique(v)) {
    return v.topupPrice != null ? `Extra visits from ${iskPrefix(v.topupPrice)}` : undefined;
  }
  if (v.topupPrice != null) return `Top-up from ${iskPrefix(v.topupPrice)}`;
  if (v.daypassPrice != null) return `Day pass from ${iskPrefix(v.daypassPrice)}`;
  return undefined;
}
