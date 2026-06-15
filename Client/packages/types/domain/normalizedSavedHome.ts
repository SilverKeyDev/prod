/**
 * Normalized saved-home row used in React Query cache and UI (after mapSavedHomeWireToSavedHome).
 * Not the API wire shape; that is SavedHomeRecord in savedHome.ts (OpenAPI SavedHome).
 */
export type NormalizedSavedHome = {
  home_id: string;
  /** Provider listing id (e.g. Zillow zpid) when present on the wire. */
  zpid?: string;
  /** MLS or provider listing key when present on the wire. */
  mls_home_id?: string;
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
  /** When present from API, used for Library sort (newest / oldest). */
  created_at?: string | null;
  updated_at?: string | null;
};
