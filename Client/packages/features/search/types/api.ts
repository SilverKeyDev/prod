/**
 * Search and isochrone API contracts (requests, responses, preferences).
 */

import type { PropertySearchResult } from "./property";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PreferencesResponse = {
  preferences: {
    preferences_version: string;
    [key: string]: unknown;
  };
};

export type IsochroneGeometry = {
  geometry: {
    coordinates: number[][][];
    type: string;
  };
};

export type UserPreferencesData = {
  home_budget_min?: number;
  home_budget_max?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  preferredBedrooms?: number;
};

export type SearchByPolygonRequest = {
  user_preferences?: {
    home_budget_min?: number;
    home_budget_max?: number;
    preferred_bedrooms?: number;
    preferred_bathrooms?: number;
    preferred_bedrooms_max?: number;
    preferred_bathrooms_max?: number;
    preferred_housing_type?: string;
    preferred_home_age?: string;
    preferred_lot_size?: string;
    preferred_lot_size_min?: number;
    preferred_lot_size_max?: number;
    preferred_home_age_max?: number;
    must_have?: string[];
    preferred_sqft_min?: number;
    preferred_sqft_max?: number;
    listing_type?: string[];
    days_on_market_min?: number;
    days_on_market_max?: number;
    preferred_home_features?: string[];
    deal_breakers?: string[];
    important_locations?: Array<{
      address: string;
      commute_tolerance?: number;
      lat?: number | null;
      lng?: number | null;
    }>;
  };
  perBucketPages?: number;
  onlyCached?: boolean;
  forceSearch?: boolean;
};

export type SearchByPolygonResponse = {
  success: boolean;
  properties?: PropertySearchResult[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
  meta?: {
    cached?: boolean;
    cacheAge?: string;
    requestsMade?: number;
    deduped?: number;
    errors?: unknown[];
    status_type?: string;
    pagesTried?: number;
    searchTime?: number;
    scored?: boolean;
    requestId?: string;
    limit?: number;
  };
};

export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === "object" && obj !== null && typeof (obj as ApiResponse<T>).success === "boolean"
  );
}
