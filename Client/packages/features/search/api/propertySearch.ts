import { searchApi } from "packages/config/http/api";
import {
  warnSearchAreaInvalid,
  warnSearchServerOrTimeout,
} from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchFilterOverrides } from "packages/store";
import type {
  IsochroneData,
  SearchByPolygonRequest,
  SearchByPolygonResponse,
  UserPreferencesData,
  ViewportPolygonPoint,
} from "packages/types/domain/api";

import { handlePolygonSearchResponse } from "./polygonPropertySearchResponse";
import {
  compactSearchFilterOverridesForPolygon,
  type MapPreviewSearchLifecycleHooks,
  type SearchResult,
} from "./propertySearchTypes";

export type {
  LatLng,
  MapPreviewSearchLifecycleHooks,
  SearchByPolygonParams,
  SearchResult,
  UserPreferences,
} from "./propertySearchTypes";
export { compactSearchFilterOverridesForPolygon } from "./propertySearchTypes";

/**
 * Search properties within an isochrone polygon using the backend API
 * Backend now pulls user preferences from database, so we don't need to send them
 */
export const searchPropertiesInIsochrone = async (
  isochroneData: IsochroneData,
  _userPreferences: UserPreferencesData,
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  _saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>,
  searchFilterOverrides: SearchFilterOverrides,
  preferencesStrictFilter: boolean,
  preferencesUserId?: string | null,
  signal?: AbortSignal,
  mapPreview?: MapPreviewSearchLifecycleHooks
): Promise<void> => {
  setIsSearching(true);
  setSearchStage("Locating homes in your area...");
  setSearchResults([]);
  mapPreview?.onSearchStartClearDismissals?.();

  if (!isochroneData?.isochrone?.geometry) {
    log.warn(LOG_CATEGORIES.SEARCH, "No isochrone geometry available for property search");
    warnSearchAreaInvalid("geometry");
    setIsSearching(false);
    setSearchStage("");
    return;
  }

  const centerLat = isochroneData.center?.lat ?? 0;
  const centerLng =
    isochroneData.center?.lon ?? (isochroneData.center as { lng?: number } | undefined)?.lng ?? 0;

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

    log.info(LOG_CATEGORIES.SEARCH, "Isochrone search: request filters (overrides + payload)", {
      overrideBedMin: overrides.preferred_bedrooms_min ?? null,
      overrideBedMax: overrides.preferred_bedrooms_max ?? null,
      overrideBathMin: overrides.preferred_bathrooms_min ?? null,
      overrideBathMax: overrides.preferred_bathrooms_max ?? null,
      overrideLotHomeKeys: userPrefsOverride ? Object.keys(userPrefsOverride) : [],
      includesUserPreferenceOverrides:
        searchRequest.user_preferences != null &&
        typeof searchRequest.user_preferences === "object",
      perBucketPages: searchRequest.perBucketPages,
      forceSearch: searchRequest.forceSearch,
    });

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
      preferencesStrictFilter,
      mapPreview,
      signal
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    log.error(LOG_CATEGORIES.ERRORS, "Error in automatic isochrone property search", error);
    log.error(LOG_CATEGORIES.ERRORS, "Error details", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      isochroneData,
    });
    warnSearchServerOrTimeout(error);
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
  mapPreview?: MapPreviewSearchLifecycleHooks
): Promise<void> => {
  setIsSearching(true);
  setSearchStage("Searching this area...");
  setSearchResults([]);
  mapPreview?.onSearchStartClearDismissals?.();

  if (!viewportPolygon || viewportPolygon.length < 4) {
    log.warn(LOG_CATEGORIES.SEARCH, "Viewport polygon missing or too small");
    warnSearchAreaInvalid("viewport");
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
      preferencesStrictFilter,
      mapPreview,
      signal
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    log.error(LOG_CATEGORIES.ERRORS, "Error in viewport property search", error);
    warnSearchServerOrTimeout(error);
    setIsSearching(false);
    setSearchStage("");
  }
};
