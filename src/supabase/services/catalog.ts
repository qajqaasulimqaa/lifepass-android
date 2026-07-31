// Live priced plan catalogue — `GET /catalog/plans`. Mirrors iOS
// PaymentService.fetchPlanCatalog + Plan.swift PlanCatalog.
//
// The static plan COPY (names, feature bullets, which card is "popular") stays
// in the app; only the PRICES come from the server, so the app and the website
// can never disagree on what a plan costs. A missing entry yields `null` —
// which must render as "no price shown", never as 0.
import { apiGet } from '../../api/client';

export type CatalogTier = {
  slug: string;
  name: string;
  priceIsk: number;
  /** The slug a subscribe button checks out; null when no active monthly
   *  product is bound (price still renders, but there is nothing to buy). */
  productSlug: string | null;
  networkCap: number;
  poolCap: number;
  dailyCap: number;
  popular: boolean;
};

export type CatalogPassSku = {
  slug: string;
  name: string;
  priceIsk: number;
  visits: number;
  validityDays: number;
};

export type PlanCatalog = {
  tiers: CatalogTier[];
  dayPasses: CatalogPassSku[];
  packs: CatalogPassSku[];
};

/**
 * `GET /catalog/plans` — the live priced catalogue. Public and unauthenticated
 * on the server (choosing a plan precedes having an account). Callers treat a
 * failure as "no prices available" and still render the cards.
 */
export function fetchPlanCatalog(): Promise<PlanCatalog> {
  return apiGet<PlanCatalog>('/catalog/plans');
}

/**
 * Monthly/pass price (ISK) for a product slug, or null when the catalogue has
 * no entry (an unlisted SKU, or a server too old to serve this route). Mirrors
 * iOS `PlanCatalog.priceIsk(forProductSlug:)`.
 */
export function priceIskForSlug(catalog: PlanCatalog, slug: string): number | null {
  const tier = catalog.tiers.find((t) => t.productSlug === slug);
  if (tier) return tier.priceIsk;
  const pass = [...catalog.dayPasses, ...catalog.packs].find((p) => p.slug === slug);
  return pass ? pass.priceIsk : null;
}
