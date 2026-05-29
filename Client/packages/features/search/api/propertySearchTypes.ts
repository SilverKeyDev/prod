import type { SearchFilterOverrides } from "packages/store";
import type { SearchByPolygonRequest } from "packages/types/domain/api";

export type LatLng = {
  lat: number;
  lng: number;
};

/** Optional hooks for map listing preview lifecycle (clear dismissals on new search / when results land). */
export type MapPreviewSearchLifecycleHooks = {
  onSearchStartClearDismissals?: () => void;
  onResultsCommittedEnablePreviews?: () => void;
};

export type SearchResult = {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType: string;
  listingStatus: string;
  imageUrl: string;
  _score: number;
};

/** Legacy polygon payload shape; prefer numeric ranges for lot/home age when present. */
export type UserPreferences = {
  home_budget_min: number;
  home_budget_max: number;
  preferred_bedrooms_min: number;
  preferred_bathrooms_min: number;
  preferred_housing_type: string;
  preferred_home_age?: string;
  preferred_lot_size?: string;
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
  preferred_home_features: string[];
  deal_breakers: string[];
  important_locations: Array<{
    address: string;
    commute_tolerance?: number;
    lat?: number | null;
    lng?: number | null;
  }>;
};

const POLYGON_SEARCH_OVERRIDE_KEYS: (keyof SearchFilterOverrides)[] = [
  "home_budget_min",
  "home_budget_max",
  "preferred_bedrooms_min",
  "preferred_bedrooms_max",
  "preferred_bathrooms_min",
  "preferred_bathrooms_max",
  "preferred_sqft_min",
  "preferred_sqft_max",
  "preferred_lot_size_min",
  "preferred_lot_size_max",
  "preferred_home_age_min",
  "preferred_home_age_max",
];

const POLYGON_SEARCH_LIST_OVERRIDE_KEYS: (keyof SearchFilterOverrides)[] = [
  "listing_type",
  "must_have",
  "preferred_home_features",
];

const POLYGON_SEARCH_STRING_OVERRIDE_KEYS: (keyof SearchFilterOverrides)[] = [
  "preferred_housing_type",
];

/** Build non-empty user_preferences for polygon search when any slider override is set. */
export function compactSearchFilterOverridesForPolygon(
  overrides: SearchFilterOverrides,
): SearchByPolygonRequest["user_preferences"] | undefined {
  const out: Record<string, number | string | string[]> = {};
  for (const k of POLYGON_SEARCH_OVERRIDE_KEYS) {
    const v = overrides[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    }
  }
  for (const k of POLYGON_SEARCH_LIST_OVERRIDE_KEYS) {
    const v = overrides[k];
    if (Array.isArray(v)) {
      out[k] = [...v];
    }
  }
  for (const k of POLYGON_SEARCH_STRING_OVERRIDE_KEYS) {
    const v = overrides[k];
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return Object.keys(out).length > 0
    ? (out as SearchByPolygonRequest["user_preferences"])
    : undefined;
}

export type SearchByPolygonParams = {
  polygon: LatLng[];
  user_preferences: UserPreferences;
  status_type?: string;
  perBucketPages?: number;
  maxRetries?: number;
};
