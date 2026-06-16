/**
 * Souk feature barrel export.
 *
 * The router and a few other features import the Souk pages and types from here.
 * Right now these point at placeholder stubs — replace the stubs with your real
 * implementation and keep this barrel pointing at them.
 */
export {
  SoukHomePage,
  SoukCategoryPage,
  SoukListingDetailPage,
  SoukCreateListingPage,
  SoukMyListingsPage,
  SoukSellerProfilePage,
  SoukSavedPage,
} from './pages/SoukPlaceholder';

export type {
  Listing,
  ListingType,
  RankedListing,
  CreateListingInput,
} from './types/souk.types';
