/**
 * Souk (marketplace) types — STARTER STUB.
 *
 * These are intentionally minimal. Replace them with the real shape you design
 * from the prototype + mock data. The names below are the only ones the rest of
 * the app currently imports, so keep them exported (or update the importers).
 */

export type ListingType =
  | 'products'
  | 'services'
  | 'freelancers'
  | 'jobs'
  | 'rentals'
  | 'giveaways'
  | 'islamic'
  | 'local'
  | 'digital';

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  // TODO: design the rest from the prototype + mock-data/listings.json
  [key: string]: unknown;
}

export interface RankedListing extends Listing {
  score?: number;
}

export interface CreateListingInput {
  title: string;
  type: ListingType;
  // TODO
  [key: string]: unknown;
}
