/**
 * Normalized saved-home row used in React Query cache and UI (after mapHomeUniversalToSavedHome).
 * Not the API wire shape; that is SavedHomeRecord in savedHome.ts (OpenAPI SavedHome).
 */
export type NormalizedSavedHome = {
  home_id: string;
  description: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size: string;
  image_url?: string;
  lat?: number;
  lng?: number;
  _databaseId?: string;
};
