import { useCallback, useMemo, useRef } from "react";

import {
  searchPropertiesInIsochrone,
  searchPropertiesInViewport,
} from "packages/features/search/api/propertySearch";
import { searchApi } from "packages/features/search/api/search";
import type { SearchResult } from "packages/features/search/types";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import {
  centroidOfViewportRing,
  mapViewportFromLatLngDeltas,
} from "packages/features/search/utils/map/mapViewport";
import {
  warnSearchAreaInvalid,
  warnSearchFailed,
} from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchFilterOverrides } from "packages/store";
import type { IsochroneData } from "packages/types/domain/api";

export type UseSearchScreenSearchExecutionParams = {
  isSearching: boolean;
  searchResults: SearchResult[];
  currentPage: number;
  searchStage: string;
  searchFilterOverrides: SearchFilterOverrides;
  preferencesStrictFilter: boolean;
  selectedClientId: string | null;
  lastMapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  setSearchSource: (source: "preferences" | "location") => void;
  clearLocationPlaceSearchArea: () => void;
  setLocationSearchOverlayData: (overlay: IsochroneData | null) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchStage: (stage: string) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  clearDismissedMapPreviews: () => void;
};

export function useSearchScreenSearchExecution({
  isSearching,
  searchResults,
  currentPage,
  searchStage,
  searchFilterOverrides,
  preferencesStrictFilter,
  selectedClientId,
  lastMapRegion,
  setSearchSource,
  clearLocationPlaceSearchArea,
  setLocationSearchOverlayData,
  setSearchResults,
  setIsSearching,
  setSearchStage,
  setHasSearched,
  setCurrentPage,
  setShowPropertyModals,
  clearDismissedMapPreviews,
}: UseSearchScreenSearchExecutionParams) {
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const mapPreviewSearchLifecycle = useMemo(
    () => ({
      onSearchStartClearDismissals: clearDismissedMapPreviews,
      onResultsCommittedEnablePreviews: () => {
        clearDismissedMapPreviews();
      },
    }),
    [clearDismissedMapPreviews]
  );

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } = usePreActionSnapshot<{
    results: SearchResult[];
    currentPage: number;
    searchStage: string;
  }>("search_pre_cancel_snapshot");

  const runSearch = useCallback(async () => {
    if (isSearching) return;
    setSearchSource("preferences");
    clearLocationPlaceSearchArea();
    log.info(LOG_CATEGORIES.SEARCH, "Mobile search runSearch start (isochrone flow)", {});

    snapshotPreSearch({
      results: searchResults,
      currentPage,
      searchStage,
    });

    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setIsSearching(true);
    setSearchStage("Preparing search...");
    setSearchResults([]);
    try {
      const response = await searchApi.getIsochrone({
        preferencesUserId: selectedClientId ?? undefined,
      });
      if (!response.success || !response.data) {
        log.warn(LOG_CATEGORIES.SEARCH, "Isochrone API returned no data", {
          success: response.success,
        });
        setSearchStage("No search area. Add important locations in Filters.");
        warnSearchAreaInvalid("isochrone_api");
        setIsSearching(false);
        return;
      }
      await searchPropertiesInIsochrone(
        response.data as IsochroneData,
        {},
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        async () => {},
        searchFilterOverrides,
        preferencesStrictFilter,
        selectedClientId,
        controller.signal,
        mapPreviewSearchLifecycle
      );
      log.info(LOG_CATEGORIES.SEARCH, "Mobile search runSearch success (isochrone flow)", {});
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSearchStage("Search failed");
      warnSearchFailed(error);
      log.error(LOG_CATEGORIES.SEARCH, "Mobile search runSearch failed", error);
    } finally {
      searchAbortControllerRef.current = null;
      setIsSearching(false);
    }
  }, [
    currentPage,
    isSearching,
    searchResults,
    searchStage,
    searchFilterOverrides,
    preferencesStrictFilter,
    setCurrentPage,
    setHasSearched,
    setIsSearching,
    setSearchResults,
    setSearchStage,
    setShowPropertyModals,
    snapshotPreSearch,
    setSearchSource,
    clearLocationPlaceSearchArea,
    selectedClientId,
    mapPreviewSearchLifecycle,
  ]);

  const runMapAreaSearch = useCallback(async () => {
    if (isSearching) return;
    if (!lastMapRegion) {
      return;
    }
    setSearchSource("location");
    log.info(LOG_CATEGORIES.SEARCH, "Mobile viewport search start", {});

    snapshotPreSearch({
      results: searchResults,
      currentPage,
      searchStage,
    });

    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    const ring = mapViewportFromLatLngDeltas(lastMapRegion);
    const center = centroidOfViewportRing(ring);
    setLocationSearchOverlayData(buildIsochroneOverlayFromViewportRing(ring, center));

    try {
      await searchPropertiesInViewport(
        ring,
        center,
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        searchFilterOverrides,
        preferencesStrictFilter,
        selectedClientId,
        controller.signal,
        mapPreviewSearchLifecycle
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSearchStage("Search failed");
      warnSearchFailed(error);
      log.error(LOG_CATEGORIES.SEARCH, "Mobile viewport search failed", error);
    } finally {
      searchAbortControllerRef.current = null;
    }
  }, [
    currentPage,
    isSearching,
    searchResults,
    searchStage,
    searchFilterOverrides,
    preferencesStrictFilter,
    setCurrentPage,
    setHasSearched,
    setIsSearching,
    setSearchResults,
    setSearchStage,
    setShowPropertyModals,
    snapshotPreSearch,
    setSearchSource,
    lastMapRegion,
    setLocationSearchOverlayData,
    selectedClientId,
    mapPreviewSearchLifecycle,
  ]);

  const handleCancelSearch = useCallback(() => {
    if (!isSearching) return;
    searchAbortControllerRef.current?.abort();
    const restored = restorePreSearch();
    if (restored) {
      setSearchResults(restored.results);
      setCurrentPage(restored.currentPage);
      setSearchStage(restored.searchStage);
    }
    setIsSearching(false);
  }, [
    isSearching,
    restorePreSearch,
    setCurrentPage,
    setIsSearching,
    setSearchResults,
    setSearchStage,
  ]);

  return {
    runSearch,
    runMapAreaSearch,
    handleCancelSearch,
  };
}
