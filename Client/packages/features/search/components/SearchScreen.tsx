/// <reference types="google.maps" />
import React, { useCallback, useMemo, useRef, useState } from "react";

import {
  searchPropertiesInIsochrone,
  searchPropertiesInViewport,
} from "packages/features/search/api/propertySearch";
import { searchApi } from "packages/features/search/api/search";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useSearchScreenCriteriaSummary } from "packages/features/search/hooks/ui/useSearchScreenCriteriaSummary";
import type { SearchResult } from "packages/features/search/types";
import { formatAddress } from "packages/features/search/types/search/propertyDetailsFormatters";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/locationBoundsOverlay";
import {
  centroidOfViewportRing,
  mapViewportFromLatLngDeltas,
} from "packages/features/search/utils/mapViewport";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import {
  useAgentDashboardStore,
  useAuthStore,
  useFiltersStore,
  useSearchContextStore,
  useSearchViewStore,
} from "packages/store";
import type { IsochroneData } from "packages/types/api";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { SearchScreenBody } from "./SearchScreenBody";

function noopFitMapBoundsForNative(_bounds: google.maps.LatLngBounds): void {
  // Web-only; native search uses map region from the store.
}

export function SearchScreen() {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore(
    (s) => s.setSelectedClientId,
  );
  const setSearchSource = useFiltersStore((s) => s.setSearchSource);
  const lastMapRegion = useFiltersStore((s) => s.lastMapRegion);
  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const preferencesStrictFilter = useFiltersStore(
    (s) => s.preferencesStrictFilter,
  );
  const clearDismissedMapPreviews = useFiltersStore(
    (s) => s.clearDismissedMapPreviews,
  );
  const setShowMapListingPreviewsAction = useFiltersStore(
    (s) => s.setShowMapListingPreviews,
  );
  const mapPreviewSearchLifecycle = useMemo(
    () => ({
      onSearchStartClearDismissals: clearDismissedMapPreviews,
      onResultsCommittedEnablePreviews: () => {
        clearDismissedMapPreviews();
        setShowMapListingPreviewsAction(true);
      },
    }),
    [clearDismissedMapPreviews, setShowMapListingPreviewsAction],
  );
  const authReady = useAuthStore((s) => s.authReady);
  useSearchDisplaySettings(authReady);

  const { userPreferences } = useUserPreferences({
    preferencesSubjectUserId: selectedClientId,
  });

  const data = useSearchPageData();
  const {
    filteredSearchResults,
    savedHomes,
    searchResults,
    setSearchResults,
    setIsSearching,
    setSearchStage,
    setHasSearched,
    setShowPropertyModals,
    isSearching,
    searchStage,
    hasSearched,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    saveHome,
    removeSavedHome,
    isHomeSaved,
    isLoadingSearchResults,
    isLoadingPropertyDetails,
    isLoadingIsochrone,
    displayIsochroneData,
  } = data;

  const navigation = useNavigation();

  const searchFilterOverrides = useSearchContextStore(
    (s) => s.searchFilterOverrides,
  );
  const clearLocationPlaceSearchArea = useSearchContextStore(
    (s) => s.clearLocationPlaceSearchArea,
  );
  const setLocationSearchOverlayData = useSearchContextStore(
    (s) => s.setLocationSearchOverlayData,
  );

  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [displaySheetOpen, setDisplaySheetOpen] = useState(false);

  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } =
    usePreActionSnapshot<{
      results: SearchResult[];
      currentPage: number;
      searchStage: string | null;
    }>("search_pre_cancel_snapshot");

  const runSearch = useCallback(async () => {
    if (isSearching) return;
    setSearchSource("preferences");
    clearLocationPlaceSearchArea();
    log.info(
      LOG_CATEGORIES.SEARCH,
      "Mobile search runSearch start (isochrone flow)",
      {},
    );

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
        mapPreviewSearchLifecycle,
      );
      log.info(
        LOG_CATEGORIES.SEARCH,
        "Mobile search runSearch success (isochrone flow)",
        {},
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSearchStage("Search failed");
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
      showErrorToast(
        SEARCH_TRANSLATIONS["search.map_area_unavailable"] ??
          "Move the map, then search this area.",
      );
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
    setLocationSearchOverlayData(
      buildIsochroneOverlayFromViewportRing(ring, center),
    );

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
        mapPreviewSearchLifecycle,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSearchStage("Search failed");
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

  const criteriaSummary = useSearchScreenCriteriaSummary(
    userPreferences as Record<string, unknown> | null | undefined,
  );

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      log.info(LOG_CATEGORIES.SEARCH, "Mobile search tab change", {
        from: activeTab,
        to: tab,
      });
      setActiveTab(tab);
      setCurrentPage(0);
    },
    [activeTab, setActiveTab, setCurrentPage],
  );

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

  const handleViewPropertyDetails = useCallback(
    (property: SearchResult) => {
      const address =
        typeof property.address === "string"
          ? property.address
          : formatAddress(property.address);
      navigation.navigate("PROPERTY_DETAILS", {
        address: address || property.id,
        propertyId: property.id,
      });
    },
    [navigation],
  );

  const hasLocations =
    Array.isArray(userPreferences?.important_locations) &&
    (userPreferences?.important_locations?.length ?? 0) > 0;

  const headerBtnClass = `shrink-0 ${HEADER_ROW_HEIGHT}`;

  const handleSearchPress = useCallback(() => {
    if (isSearching) {
      handleCancelSearch();
      return;
    }
    if (!hasLocations) {
      showErrorToast(
        SEARCH_TRANSLATIONS["search.add_location_to_search"] ??
          "Add at least one location to search",
      );
      return;
    }
    void runSearch();
  }, [isSearching, hasLocations, handleCancelSearch, runSearch]);

  return (
    <SearchScreenBody
      mode={mode}
      toggleMode={toggleMode}
      selectedClientId={selectedClientId}
      setSelectedClientId={setSelectedClientId}
      filtersSheetOpen={filtersSheetOpen}
      setFiltersSheetOpen={setFiltersSheetOpen}
      displaySheetOpen={displaySheetOpen}
      setDisplaySheetOpen={setDisplaySheetOpen}
      headerBtnClass={headerBtnClass}
      criteriaSummary={criteriaSummary}
      isSearching={isSearching}
      handleSearchPress={handleSearchPress}
      handleCancelSearch={handleCancelSearch}
      runSearch={runSearch}
      runMapAreaSearch={runMapAreaSearch}
      activeTab={activeTab}
      handleTabChange={handleTabChange}
      filteredSearchResults={filteredSearchResults}
      savedHomes={savedHomes}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleViewPropertyDetails={handleViewPropertyDetails}
      saveHome={saveHome}
      removeSavedHome={removeSavedHome}
      isHomeSaved={isHomeSaved}
      searchResults={searchResults}
      searchStage={searchStage}
      hasSearched={hasSearched}
      setHasSearched={setHasSearched}
      isLoadingPropertyDetails={isLoadingPropertyDetails}
      isLoadingSearchResults={isLoadingSearchResults}
      isLoadingIsochrone={isLoadingIsochrone}
      displayIsochroneData={displayIsochroneData}
      showCommuteOverlay={showCommuteOverlay}
      mapHomeCardsCount={mapHomeCardsCount}
      hasLocations={hasLocations}
      fitMapBoundsForNative={noopFitMapBoundsForNative}
    />
  );
}
