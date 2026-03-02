/**
 * Property-related API types and shared property shapes (SavedHome, analysis).
 */

import type { SavedHome } from "packages/types/savedHome";

import type { SearchResult } from "./result";

export type HomeUniversal = {
  address: string;
  price?: number;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: number;
  property_type?: string;
  listing_status?: string;
  image_url?: string;
  lat?: number;
  lng?: number;
};

export type PropertySearchResult = {
  zpid?: string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  latitude?: number;
  longitude?: number;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  propertyType?: string;
  listingStatus?: string;
  imgSrc?: string;
  _score?: number;
};

/** Re-export for consumers that import SavedHome from search types/property */
export type { SavedHome } from "packages/types/savedHome";

/** Alias for map/card code that accepts SearchResult | SavedHome */
export type Property = SavedHome;

/** Property analysis from research/offer API (pros, cons, dynamic sections) */
export type PropertyAnalysis = {
  pros?: string[];
  cons?: string[];
  [key: string]: unknown;
};

/** SearchResult with optional property_analysis (from research/offer flow) */
export type PropertyWithAnalysis = SearchResult & {
  property_analysis?: PropertyAnalysis;
};
