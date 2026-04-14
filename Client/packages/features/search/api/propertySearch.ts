import { searchApi } from "packages/config/http/api";
import { transformPropertySearchResult } from "packages/features/search/utils/searchTransform";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchFilterOverrides } from "packages/store";
import type {
  IsochroneData,
  PropertySearchResult,
  SearchByPolygonRequest,
  SearchByPolygonResponse,
  UserPreferencesData,
  ViewportPolygonPoint,
} from "packages/types/api";

export type LatLng = {
  lat: number;
  lng: number;
};

/** Optional hooks for dev map listing preview lifecycle (clear dismissals on new search, enable previews when results land). */
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
  "preferred_bedrooms_min",
  "preferred_bedrooms_max",
  "preferred_bathrooms_min",
  "preferred_bathrooms_max",
  "preferred_lot_size_min",
  "preferred_lot_size_max",
  "preferred_home_age_min",
  "preferred_home_age_max",
];

const POLYGON_SEARCH_LIST_OVERRIDE_KEYS: (keyof SearchFilterOverrides)[] = [
  "must_have",
  "preferred_home_features",
];

/** Build non-empty user_preferences for polygon search when any slider override is set. */
export function compactSearchFilterOverridesForPolygon(
  overrides: SearchFilterOverrides,
): SearchByPolygonRequest["user_preferences"] | undefined {
  const out: Record<string, number | string[]> = {};
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

async function handlePolygonSearchResponse(
  searchResult: SearchByPolygonResponse,
  center: { lat: number; lng: number },
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  mapPreview?: MapPreviewSearchLifecycleHooks,
): Promise<void> {
  if (!searchResult.success) {
    throw new Error(searchResult.error ?? "Search failed");
  }

  const apiPropertyCount = searchResult.properties?.length ?? 0;
  log.info(
    LOG_CATEGORIES.SEARCH,
    "Polygon search: raw API homes before client transform",
    {
      propertiesCount: apiPropertyCount,
      totalCount: searchResult.total_count,
      meta: searchResult.meta,
    },
  );

  if (searchResult.meta?.cached !== undefined) {
    if (searchResult.meta.cached) {
      log.info(LOG_CATEGORIES.SEARCH, "Cache HIT - Using cached results", {
        cacheAge: searchResult.meta.cacheAge ?? "unknown",
      });
    } else {
      log.info(LOG_CATEGORIES.SEARCH, "Cache MISS - Performing new search");
    }
  }

  if (!searchResult.meta?.cached) {
    setSearchStage("Evaluating scores...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setSearchStage("Scoring homes based on your preferences...");
  } else {
    setSearchStage("Loading cached results...");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (searchResult.properties && searchResult.properties.length > 0) {
    const firstProp = searchResult.properties[0];
    if (firstProp) {
      const fp = firstProp as PropertySearchResult | Record<string, unknown>;
      const keys = Object.keys(fp);
      const scoreVal =
        "score" in fp && fp.score != null
          ? fp.score
          : "_score" in fp
            ? (fp as { _score?: number })._score
            : undefined;
      log.debug(LOG_CATEGORIES.SEARCH, "First Property Raw Data", {
        keys,
        score: scoreVal,
        scoreType: typeof scoreVal,
        hasScore: scoreVal !== undefined && scoreVal !== null,
      });
    }
  }

  const transformedResults: SearchResult[] = (
    searchResult.properties ?? []
  ).map((property, index) => {
    const p = property as PropertySearchResult | Record<string, unknown>;
    const rawScore =
      "score" in p && p.score != null
        ? p.score
        : "_score" in p
          ? (p as { _score?: number })._score
          : undefined;
    if (rawScore === 0 || rawScore === undefined || rawScore === null) {
      const listingId =
        "id" in p && typeof (p as PropertySearchResult).id === "string"
          ? (p as PropertySearchResult).id
          : (p as { zpid?: string }).zpid;
      const addr =
        "location" in p && (p as PropertySearchResult).location != null
          ? (p as PropertySearchResult).location.address
          : (p as { address?: string }).address;
      log.warn(LOG_CATEGORIES.SEARCH, "Property missing score", {
        listingId,
        address: addr,
        rawScore,
        scoreType: typeof rawScore,
      });
    }
    return transformPropertySearchResult(
      property as PropertySearchResult,
      index,
      center,
    );
  });

  setSearchStage("Extracting property images...");
  await new Promise((resolve) => setTimeout(resolve, 800));
  setSearchStage("Finalizing results...");

  setSearchResults(transformedResults);
  setHasSearched(true);
  setIsSearching(false);
  setCurrentPage(0);
  setShowPropertyModals(true);
  mapPreview?.onResultsCommittedEnablePreviews?.();

  log.info(
    LOG_CATEGORIES.SEARCH,
    "Successfully found properties (after home matching transform)",
    {
      rawApiCount: apiPropertyCount,
      transformedCount: transformedResults.length,
      sampleIds: transformedResults.slice(0, 5).map((r) => r.id),
    },
  );
}

/**
 * Search properties within an isochrone polygon using the backend API
 * Backend now pulls user preferences from database, so we don't need to send them
 */
export const searchPropertiesInIsochrone = async (
  isochroneData: IsochroneData,
  _userPreferences: UserPreferencesData, // Kept for backward compatibility but not used
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  _saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>, // Deprecated: kept for backward compatibility, no longer used
  searchFilterOverrides: SearchFilterOverrides,
  preferencesStrictFilter: boolean,
  preferencesUserId?: string | null,
  signal?: AbortSignal,
  mapPreview?: MapPreviewSearchLifecycleHooks,
): Promise<void> => {
  setIsSearching(true);
  setSearchStage("Locating homes in your area...");
  setSearchResults([]);
  mapPreview?.onSearchStartClearDismissals?.();

  if (!isochroneData?.isochrone?.geometry) {
    log.warn(
      LOG_CATEGORIES.SEARCH,
      "No isochrone geometry available for property search",
    );
    setIsSearching(false);
    return;
  }

  const centerLat = isochroneData.center?.lat ?? 0;
  const centerLng =
    isochroneData.center?.lon ??
    (isochroneData.center as { lng?: number } | undefined)?.lng ??
    0;

  try {
    setSearchStage("Extracting property data...");

    const overrides = searchFilterOverrides;
    const userPrefsOverride = compactSearchFilterOverridesForPolygon(overrides);
    const searchRequest: SearchByPolygonRequest = {
      perBucketPages: 20,
      forceSearch: true,
      preferences_strict_filter: preferencesStrictFilter,
      ...(userPrefsOverride ? { user_preferences: userPrefsOverride } : {}),
      ...(preferencesUserId != null && preferencesUserId !== ""
        ? { preferences_user_id: preferencesUserId }
        : {}),
    };

    log.info(
      LOG_CATEGORIES.SEARCH,
      "Isochrone search: request filters (overrides + payload)",
      {
        overrideBedMin: overrides.preferred_bedrooms_min ?? null,
        overrideBedMax: overrides.preferred_bedrooms_max ?? null,
        overrideBathMin: overrides.preferred_bathrooms_min ?? null,
        overrideBathMax: overrides.preferred_bathrooms_max ?? null,
        overrideLotHomeKeys: userPrefsOverride
          ? Object.keys(userPrefsOverride)
          : [],
        includesUserPreferenceOverrides:
          searchRequest.user_preferences != null &&
          typeof searchRequest.user_preferences === "object",
        perBucketPages: searchRequest.perBucketPages,
        forceSearch: searchRequest.forceSearch,
      },
    );

    const searchResult = (await searchApi.searchByPolygon(searchRequest, {
      signal,
    })) as SearchByPolygonResponse;

    await handlePolygonSearchResponse(
      searchResult,
      { lat: centerLat, lng: centerLng },
      setSearchStage,
      setSearchResults,
      setIsSearching,
      setHasSearched,
      setCurrentPage,
      setShowPropertyModals,
      mapPreview,
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    log.error(
      LOG_CATEGORIES.ERRORS,
      "Error in automatic isochrone property search",
      error,
    );
    log.error(LOG_CATEGORIES.ERRORS, "Error details", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      isochroneData,
    });
    setIsSearching(false);
    setSearchStage("");
  }
};

/**
 * Search properties inside the current map viewport (Zillow-style area search).
 */
export const searchPropertiesInViewport = async (
  viewportPolygon: ViewportPolygonPoint[],
  mapCenter: { lat: number; lng: number },
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  searchFilterOverrides: SearchFilterOverrides,
  preferencesStrictFilter: boolean,
  preferencesUserId?: string | null,
  signal?: AbortSignal,
  mapPreview?: MapPreviewSearchLifecycleHooks,
): Promise<void> => {
  setIsSearching(true);
  setSearchStage("Searching this area...");
  setSearchResults([]);
  mapPreview?.onSearchStartClearDismissals?.();

  if (!viewportPolygon || viewportPolygon.length < 4) {
    log.warn(LOG_CATEGORIES.SEARCH, "Viewport polygon missing or too small");
    setIsSearching(false);
    setSearchStage("");
    return;
  }

  try {
    setSearchStage("Extracting property data...");
    const overrides = searchFilterOverrides;
    const userPrefsOverride = compactSearchFilterOverridesForPolygon(overrides);
    const searchRequest: SearchByPolygonRequest = {
      perBucketPages: 20,
      forceSearch: true,
      preferences_strict_filter: preferencesStrictFilter,
      viewport_polygon: viewportPolygon,
      ...(userPrefsOverride ? { user_preferences: userPrefsOverride } : {}),
      ...(preferencesUserId != null && preferencesUserId !== ""
        ? { preferences_user_id: preferencesUserId }
        : {}),
    };

    log.info(LOG_CATEGORIES.SEARCH, "Viewport polygon search request", {
      pointCount: viewportPolygon.length,
      hasOverrides: Boolean(userPrefsOverride),
    });

    const searchResult = (await searchApi.searchByPolygon(searchRequest, {
      signal,
    })) as SearchByPolygonResponse;

    await handlePolygonSearchResponse(
      searchResult,
      mapCenter,
      setSearchStage,
      setSearchResults,
      setIsSearching,
      setHasSearched,
      setCurrentPage,
      setShowPropertyModals,
      mapPreview,
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    log.error(
      LOG_CATEGORIES.ERRORS,
      "Error in viewport property search",
      error,
    );
    setIsSearching(false);
    setSearchStage("");
  }
};
