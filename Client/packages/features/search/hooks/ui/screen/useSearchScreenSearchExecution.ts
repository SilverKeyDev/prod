import { useCallback, useRef } from "react";

import { searchPropertiesInViewport } from "packages/features/search/api/propertySearch";
import { searchApi } from "packages/features/search/api/search";
import { useSearchMapPreviewSearchLifecycle } from "packages/features/search/hooks/ui/useSearchMapPreviewSearchLifecycle";
import type { SearchResult } from "packages/features/search/types";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import { normalizeIsochroneApiData } from "packages/features/search/utils/map/normalizeIsochroneApiData";
import {
  warnSearchAreaWarnings,
  warnSearchServerOrTimeout,
} from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchFilterOverrides } from "packages/store";
import type { IsochroneData } from "packages/types/domain/api";

import {
  resolveSearchArea,
  viewportRingFromMapRegion,
} from "@/features/search/utils/searchArea/resolveSearchArea";

export type UseSearchScreenSearchExecutionParams = {
  isSearching: boolean;
  searchResults: SearchResult[];
  currentPage: number;
  searchStage: string;
  searchFilterOverrides: SearchFilterOverrides;
  preferencesStrictFilter: boolean;
  selectedClientId: string | null;
  importantLocations: unknown;
  locationPlaceViewportRing: Array<{ lat: number; lng: number }> | null;
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
};

export function useSearchScreenSearchExecution({
  isSearching,
  searchResults,
  currentPage,
  searchStage,
  searchFilterOverrides,
  preferencesStrictFilter,
  selectedClientId,
  importantLocations,
  locationPlaceViewportRing,
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
}: UseSearchScreenSearchExecutionParams) {
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const mapPreviewSearchLifecycle = useSearchMapPreviewSearchLifecycle();

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } = usePreActionSnapshot<{
    results: SearchResult[];
    currentPage: number;
    searchStage: string;
  }>("search_pre_cancel_snapshot");

  const runSearch = useCallback(async () => {
    if (isSearching) return;

    snapshotPreSearch({
      results: searchResults,
      currentPage,
      searchStage,
    });

    const controller = new AbortController();
    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = controller;

    setIsSearching(true);
    setSearchStage("Preparing search...");
    setSearchResults([]);
    log.info(LOG_CATEGORIES.SEARCH, "Mobile unified search start", {});

    try {
      const mapBoundsRing = lastMapRegion ? viewportRingFromMapRegion(lastMapRegion) : null;
      if (!locationPlaceViewportRing?.length) {
        clearLocationPlaceSearchArea();
      }

      const resolved = await resolveSearchArea({
        locationPlaceViewportRing,
        importantLocations,
        mapBoundsRing,
        fetchIsochrone: async () => {
          const response = await searchApi.getIsochrone({
            preferencesUserId: selectedClientId ?? undefined,
            signal: controller.signal,
          });
          if (response.success && response.data) {
            return normalizeIsochroneApiData(response.data);
          }
          return null;
        },
      });

      warnSearchAreaWarnings(resolved.warnings);
      setSearchSource(resolved.searchSource);
      setLocationSearchOverlayData(
        buildIsochroneOverlayFromViewportRing(resolved.viewportRing, resolved.center)
      );

      await searchPropertiesInViewport(
        resolved.viewportRing,
        resolved.center,
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
      log.info(LOG_CATEGORIES.SEARCH, "Mobile unified search success", { mode: resolved.mode });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSearchStage("");
      warnSearchServerOrTimeout(error);
      log.error(LOG_CATEGORIES.SEARCH, "Mobile unified search failed", error);
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
    importantLocations,
    locationPlaceViewportRing,
    lastMapRegion,
    setCurrentPage,
    setHasSearched,
    setIsSearching,
    setSearchResults,
    setSearchStage,
    setShowPropertyModals,
    snapshotPreSearch,
    setSearchSource,
    clearLocationPlaceSearchArea,
    setLocationSearchOverlayData,
    selectedClientId,
    mapPreviewSearchLifecycle,
  ]);

  const runMapAreaSearch = useCallback(async () => {
    if (isSearching) return;
    await runSearch();
  }, [isSearching, runSearch]);

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
