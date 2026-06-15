/// <reference types="google.maps" />
import React, { useCallback, useState } from "react";

import { useAgentSyncPreferencesWhenClientSelected } from "packages/features/agent/hooks/data/search/useAgentSyncPreferencesWhenClientSelected";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useSearchScreenCriteriaSummary } from "packages/features/search/hooks/ui/screen/useSearchScreenCriteriaSummary";
import { useSearchScreenSearchExecution } from "packages/features/search/hooks/ui/screen/useSearchScreenSearchExecution";
import type { SearchResult } from "packages/features/search/types";
import { formatAddress } from "packages/features/search/types/search/formatters/propertyDetailsFormatters";
import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import {
  useAgentDashboardStore,
  useAuthStore,
  useFiltersStore,
  useSearchContextStore,
  useSearchViewStore,
} from "packages/store";
import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";

import { SearchScreenBody } from "./SearchScreenBody";

function noopFitMapBoundsForNative(_bounds: google.maps.LatLngBounds): void {
  // Web-only; native search uses map region from the store.
}

export function SearchScreen() {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);
  useAgentSyncPreferencesWhenClientSelected(selectedClientId);
  const setSearchSource = useFiltersStore((s) => s.setSearchSource);
  const lastMapRegion = useFiltersStore((s) => s.lastMapRegion);
  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const preferencesStrictFilter = useFiltersStore((s) => s.preferencesStrictFilter);
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

  const searchFilterOverrides = useSearchContextStore((s) => s.searchFilterOverrides);
  const clearLocationPlaceSearchArea = useSearchContextStore((s) => s.clearLocationPlaceSearchArea);
  const setLocationSearchOverlayData = useSearchContextStore((s) => s.setLocationSearchOverlayData);

  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const locationPlaceViewportRing = useSearchContextStore((s) => s.locationPlaceViewportRing);

  const {
    runSearch,
    runMapAreaSearch: runMapAreaSearchCore,
    handleCancelSearch,
  } = useSearchScreenSearchExecution({
    isSearching,
    searchResults,
    currentPage,
    searchStage,
    searchFilterOverrides,
    preferencesStrictFilter,
    selectedClientId,
    importantLocations: userPreferences?.important_locations,
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
  });

  const runMapAreaSearch = useCallback(async () => {
    await runMapAreaSearchCore();
  }, [runMapAreaSearchCore]);

  const criteriaSummary = useSearchScreenCriteriaSummary(
    userPreferences as Record<string, unknown> | null | undefined
  );

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      log.info("SEARCH", "Mobile search tab change", {
        from: activeTab,
        to: tab,
      });
      setActiveTab(tab);
      setCurrentPage(0);
    },
    [activeTab, setActiveTab, setCurrentPage]
  );

  const handleViewPropertyDetails = useCallback(
    (property: SearchResult) => {
      const address =
        typeof property.address === "string" ? property.address : formatAddress(property.address);
      navigation.navigate("PROPERTY_DETAILS", {
        address: address || property.id,
        propertyId: property.id,
      });
    },
    [navigation]
  );

  const hasLocations =
    Array.isArray(userPreferences?.important_locations) &&
    (userPreferences?.important_locations?.length ?? 0) > 0;

  const headerBtnClass = `shrink-0 ${HEADER_ROW_CONTROL_HEIGHT}`;

  const handleSearchPress = useCallback(() => {
    if (isSearching) {
      handleCancelSearch();
      return;
    }
    void runSearch();
  }, [isSearching, handleCancelSearch, runSearch]);

  const handleFiltersSheetApply = useCallback(async () => {
    if (isSearching) return;
    await runSearch();
  }, [isSearching, runSearch]);

  return (
    <SearchScreenBody
      mode={mode}
      toggleMode={toggleMode}
      selectedClientId={selectedClientId}
      setSelectedClientId={setSelectedClientId}
      filtersSheetOpen={filtersSheetOpen}
      setFiltersSheetOpen={setFiltersSheetOpen}
      headerBtnClass={headerBtnClass}
      criteriaSummary={criteriaSummary}
      isSearching={isSearching}
      handleSearchPress={handleSearchPress}
      handleCancelSearch={handleCancelSearch}
      runSearch={runSearch}
      onFiltersSheetApply={handleFiltersSheetApply}
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
