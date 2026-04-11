import React, { useCallback, useEffect, useMemo, useRef } from "react";

import IconButton from "@ui/button/IconButton";

import { useSearchRefresh } from "packages/contexts";
import { FEED_ACTION_INTERACTION_CLASS } from "packages/features/feed";
import {
  cleanupMapPropertyCard,
  renderMapPropertyCard,
} from "packages/features/search/components/cards/MapPropertyCardUtils";
import type { PreciseStreetAddressPayload } from "packages/features/search/components/header/location-bar/SearchLocationBar.web";
import SearchMobileHeader from "packages/features/search/components/header/SearchMobileHeader";
import { SearchPageMapView } from "packages/features/search/components/layout/SearchPageMapView";
import { SearchPageModals } from "packages/features/search/components/layout/SearchPageModals";
import { DesktopReelsView } from "packages/features/search/components/reels/DesktopReelsView";
import { useLastSearchPersistence } from "packages/features/search/hooks/data/page/useLastSearchPersistence";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import { useSearchPageHandlers } from "packages/features/search/hooks/data/page/useSearchPageHandlers";
import { useSearchPageMap } from "packages/features/search/hooks/data/page/useSearchPageMap";
import type { Property } from "packages/features/search/hooks/data/property/usePropertyDetails";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useSearchViewIntegration } from "packages/features/search/hooks/store/useSearchViewIntegration";
import { useSearchFeatureLifecycle } from "packages/features/search/hooks/ui/useSearchFeatureLifecycle";
import { useSearchMobileHeaderActions } from "packages/features/search/hooks/ui/useSearchMobileHeaderActions";
import type { SearchResult } from "packages/features/search/types";
import { useSearchRefreshIntegration } from "packages/hooks/data/useSearchRefreshIntegration";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { usePreActionSnapshot } from "packages/hooks/ui";
import {
  useAgentDashboardStore,
  useAuthStore,
  useFiltersStore,
  useSearchContextStore,
  useSearchViewStore,
} from "packages/store";
import { MotionView } from "packages/ui/components/adapters/motion";
import { Box } from "packages/ui/components/primitives";
import { simpleHash } from "packages/utils";
type SearchFeatureProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  onSearchProperties?: () => Promise<void>;
  searchRef?: React.MutableRefObject<{
    triggerSearch: () => Promise<void>;
  } | null>;
};

export function SearchFeature({
  setMobileHeaderActions,
  onSearchProperties,
  searchRef,
}: SearchFeatureProps) {
  const { mode: searchViewMode } = useSearchViewIntegration();
  const toggleMode = useSearchViewStore((s) => s.toggleMode);
  const searchRefresh = useSearchRefresh();
  const { invalidateSearchAndFeed } = useSearchRefreshIntegration();
  const feedScrollRef = useRef<unknown>(null);
  const setAnchor = useSearchContextStore((s) => s.setAnchor);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore(
    (s) => s.setSelectedClientId,
  );
  const setSearchSource = useFiltersStore((s) => s.setSearchSource);
  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const setUserGeolocation = useFiltersStore((s) => s.setUserGeolocation);
  const authReady = useAuthStore((s) => s.authReady);
  useSearchDisplaySettings(authReady);
  const { saveLastSearchContext } = useLastSearchPersistence();
  const { userPreferences } = useUserPreferences({
    preferencesSubjectUserId: selectedClientId,
  });
  const hasLocations = useMemo(
    () =>
      Array.isArray(userPreferences?.important_locations) &&
      (userPreferences?.important_locations?.length ?? 0) > 0,
    [userPreferences?.important_locations],
  );

  const data = useSearchPageData();
  const {
    searchResults,
    setSearchResults,
    searchStage,
    currentPage,
    setCurrentPage,
    showPropertyModals,
    setShowPropertyModals,
    setActiveTab,
    activeTab,
    filteredSearchResults,
    savedHomes,
    selectedProperty,
    clearSelectedProperty,
    isochroneData,
    displayIsochroneData,
    fetchIsochrone,
    isSearching,
    isLoadingSearchResults,
    isLoadingIsochrone,
    isLoadingPropertyDetails,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    setSearchStage,
    setIsSearching,
    setHasSearched,
    isCarouselCollapsed,
    setIsCarouselCollapsed,
  } = data;

  const handlers = useSearchPageHandlers({
    activeTab,
    currentPage,
    filteredSearchResults,
    savedHomes,
    setCurrentPage,
    selectedPropertyId: (selectedProperty as { id?: string })?.id,
    setAnchor,
    fetchPropertyDetails: async (p: unknown) => {
      await data.fetchPropertyDetails(p as Property);
    },
  });

  const { handleBeforeSwitchToReels, handleViewPropertyDetails } = handlers;

  const handlePreciseStreetAddressSelected = useCallback(
    (payload: PreciseStreetAddressPayload) => {
      const id =
        payload.placeId && payload.placeId.length > 0
          ? payload.placeId
          : `geocode:${simpleHash(payload.formattedAddress)}`;
      const property: SearchResult = {
        id,
        address: payload.formattedAddress,
        price: "",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        lat: payload.lat,
        lng: payload.lng,
        propertyType: "SINGLE_FAMILY",
        listingStatus: "FOR_SALE",
      };
      void handleViewPropertyDetails(property);
    },
    [handleViewPropertyDetails],
  );

  const handleToggleMode = useCallback(() => {
    if (searchViewMode === "map") {
      handleBeforeSwitchToReels();
    }
    toggleMode();
  }, [searchViewMode, toggleMode, handleBeforeSwitchToReels]);

  const map = useSearchPageMap({
    isochroneData,
    displayIsochroneData,
    fetchIsochrone,
    showCommuteOverlay,
    mapHomeCardsCount,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    hasSearched: data.hasSearched,
    showPropertyModals,
    selectedProperty,
    searchResults,
    setSearchStage: (stage?: string) => setSearchStage(stage ?? ""),
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    isHomeSaved,
    saveHome: async (p) => {
      await saveHome(p);
    },
    removeSavedHome: async (id, addr) => {
      await removeSavedHome(id, addr);
    },
    onMarkerClick: handlers.handleNavigateToProperty,
    onUnlockClick: handleViewPropertyDetails,
    onOpenDetails: handlers.handleOpenPropertyDetails,
    getSearchAbortSignal: () => searchAbortControllerRef.current?.signal,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    preferencesSubjectUserId: selectedClientId,
    saveLastSearchContext,
  });

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } =
    usePreActionSnapshot<{
      results: SearchResult[];
      currentPage: number;
      showPropertyModals: boolean;
    }>("search_pre_cancel_snapshot");

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      setActiveTab(tab);
      setCurrentPage(0);
      const nextData = tab === "results" ? filteredSearchResults : savedHomes;
      requestAnimationFrame(() => {
        void map.updateMapMarkers(nextData);
      });
    },
    [setActiveTab, setCurrentPage, filteredSearchResults, savedHomes, map],
  );

  const handleSearchUpdated = useCallback(async () => {
    if (!isSearching) {
      setSearchSource("preferences");
      snapshotPreSearch({
        results: searchResults,
        currentPage,
        showPropertyModals,
      });
      searchAbortControllerRef.current = new AbortController();
      if (onSearchProperties) {
        setIsSearching(true);
        setSearchStage("Preparing search...");
        await onSearchProperties();
      } else {
        await map.runPreferencesSearch();
      }
    }
  }, [
    isSearching,
    onSearchProperties,
    map,
    searchResults,
    currentPage,
    showPropertyModals,
    snapshotPreSearch,
    setSearchSource,
    setIsSearching,
    setSearchStage,
  ]);

  const handleLocationSearchSubmit = useCallback(async () => {
    if (isSearching) return;
    setSearchSource("location");
    snapshotPreSearch({
      results: searchResults,
      currentPage,
      showPropertyModals,
    });
    searchAbortControllerRef.current = new AbortController();
    await map.runViewportSearch();
  }, [
    isSearching,
    map,
    searchResults,
    currentPage,
    showPropertyModals,
    snapshotPreSearch,
    setSearchSource,
  ]);

  const handleCancelSearch = useCallback(() => {
    searchAbortControllerRef.current?.abort();
    const restored = restorePreSearch();
    if (restored) {
      setSearchResults(restored.results);
      setCurrentPage(restored.currentPage);
      setShowPropertyModals(restored.showPropertyModals);
    }
  }, [
    restorePreSearch,
    setSearchResults,
    setCurrentPage,
    setShowPropertyModals,
  ]);

  const memoizedSearchFunction = useCallback(async () => {
    if (!isSearching) {
      setSearchSource("preferences");
      await map.runPreferencesSearch();
    }
  }, [isSearching, map, setSearchSource]);

  useSearchFeatureLifecycle({
    setTriggerRefresh: searchRefresh?.setTriggerRefresh,
    feedScrollRef,
    invalidateSearchAndFeed,
    searchViewMode,
    map,
    searchRef,
    memoizedSearchFunction,
    setUserGeolocation,
    searchAbortControllerRef,
    activeTab,
    filteredSearchResultsLength: filteredSearchResults.length,
    savedHomesLength: savedHomes.length,
  });

  const { isCompactHeader, headerProps } = useSearchMobileHeaderActions({
    isSearching,
    onSearch: handleSearchUpdated,
    onCancelSearch: handleCancelSearch,
    hasLocations,
    selectedClientId,
    onClientChange: setSelectedClientId,
    mode: searchViewMode,
    onToggleMode: handleToggleMode,
    onBeforeSwitchToReels: handleBeforeSwitchToReels,
  });

  const mobileHeaderNode = useMemo(
    () =>
      isCompactHeader && searchViewMode === "map" ? (
        <SearchMobileHeader {...headerProps} />
      ) : null,
    [isCompactHeader, headerProps, searchViewMode],
  );

  useEffect(() => {
    setMobileHeaderActions(mobileHeaderNode);
    return () => setMobileHeaderActions(null);
  }, [mobileHeaderNode, setMobileHeaderActions]);

  return (
    <Box className="relative h-full">
      {/* Reels mode: Search icon to go back to map */}
      {searchViewMode === "reels" && (
        <Box className="absolute right-4 top-4 z-30 flex items-center md:flex">
          <IconButton
            variant="ghost"
            size="md"
            iconName="search"
            onClick={handleToggleMode}
            label="Back to search"
            className={`bg-black/40 text-white backdrop-blur-sm ${FEED_ACTION_INTERACTION_CLASS}`}
          />
        </Box>
      )}

      {/* Both views stay mounted so the map stays preloaded; visibility toggles for instant switch */}
      <Box className="relative h-full">
        <Box
          className={`absolute inset-0 h-full ${
            searchViewMode === "map"
              ? "z-10"
              : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={searchViewMode !== "map"}
        >
          <SearchPageMapView
            onBeforeSwitchToReels={handlers.handleBeforeSwitchToReels}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            filteredSearchResults={filteredSearchResults}
            savedHomes={savedHomes}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onViewPropertyDetails={handleViewPropertyDetails}
            onNavigateToProperty={handlers.handleNavigateToProperty}
            isHomeSaved={isHomeSaved}
            saveHome={async (p) => {
              await saveHome(p);
            }}
            removeSavedHome={async (id, addr) => {
              await removeSavedHome(id, addr);
            }}
            isCarouselCollapsed={isCarouselCollapsed}
            setIsCarouselCollapsed={setIsCarouselCollapsed}
            isSearching={isSearching}
            hasSearched={data.hasSearched}
            searchResults={searchResults}
            searchStage={searchStage}
            mapZoomIn={map.mapZoomIn}
            mapZoomOut={map.mapZoomOut}
            mobileMapRef={map.mobileMapRef}
            desktopMapRef={map.desktopMapRef}
            setShowPropertyModals={setShowPropertyModals}
            setHasSearched={setHasSearched}
            selectedPropertyId={(selectedProperty as { id?: string })?.id}
            hasLocations={hasLocations}
            onSearchProperties={handleSearchUpdated}
            onLocationSearchSubmit={handleLocationSearchSubmit}
            onCancelSearch={handleCancelSearch}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            isLoadingPropertyDetails={isLoadingPropertyDetails}
            isLoadingSearchResults={isLoadingSearchResults}
            isLoadingIsochrone={isLoadingIsochrone}
            isochroneData={displayIsochroneData}
            fitMapToBounds={map.fitMapToBounds}
            showCommuteOverlay={showCommuteOverlay}
            mapHomeCardsCount={mapHomeCardsCount}
            onPreciseStreetAddressSelected={handlePreciseStreetAddressSelected}
          />
        </Box>
        <Box
          className={`absolute inset-0 h-full ${
            searchViewMode === "reels"
              ? "z-10"
              : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={searchViewMode !== "reels"}
        >
          <MotionView
            key="reels"
            className="h-full"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DesktopReelsView
              virtuosoRef={feedScrollRef}
              filteredSearchResults={filteredSearchResults}
              onRunSearch={handleSearchUpdated}
              isSearching={isSearching}
            />
          </MotionView>
        </Box>
      </Box>

      <SearchPageModals
        selectedProperty={selectedProperty}
        onClosePropertyDetails={clearSelectedProperty}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
      />
    </Box>
  );
}
