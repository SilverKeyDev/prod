import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import IconButton from "@ui/button/IconButton";

import { useSearchRefresh } from "packages/contexts";
import { FEED_ACTION_INTERACTION_CLASS } from "packages/features/feed";
import {
  cleanupMapPropertyCard,
  renderMapPropertyCard,
} from "packages/features/search/components/cards/MapPropertyCardUtils";
import SearchMobileHeader from "packages/features/search/components/header/SearchMobileHeader";
import { SearchPageMapView } from "packages/features/search/components/layout/SearchPageMapView";
import { SearchPageModals } from "packages/features/search/components/layout/SearchPageModals";
import { DesktopReelsView } from "packages/features/search/components/reels/DesktopReelsView";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import { useSearchPageHandlers } from "packages/features/search/hooks/data/page/useSearchPageHandlers";
import { useSearchPageMap } from "packages/features/search/hooks/data/page/useSearchPageMap";
import type { Property } from "packages/features/search/hooks/data/property/usePropertyDetails";
import { useSearchViewIntegration } from "packages/features/search/hooks/store/useSearchViewIntegration";
import { useSearchMobileHeaderActions } from "packages/features/search/hooks/ui/useSearchMobileHeaderActions";
import type { SearchResult } from "packages/features/search/types";
import { useSearchRefreshIntegration } from "packages/hooks/data/useSearchRefreshIntegration";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useSearchContextStore, useSearchViewStore } from "packages/store";
import { MotionView } from "packages/ui/components/adapters/motion";

type SearchFeatureProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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

  const handleToggleMode = useCallback(() => {
    if (searchViewMode === "map") {
      handlers.handleBeforeSwitchToReels();
    }
    toggleMode();
  }, [searchViewMode, toggleMode, handlers]);

  const map = useSearchPageMap({
    isochroneData,
    fetchIsochrone,
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
    onUnlockClick: handlers.handleViewPropertyDetails,
    onOpenDetails: handlers.handleOpenPropertyDetails,
    getSearchAbortSignal: () => searchAbortControllerRef.current?.signal,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
  });

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } = usePreActionSnapshot<{
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
    [setActiveTab, setCurrentPage, filteredSearchResults, savedHomes, map]
  );

  const handleSearchUpdated = useCallback(async () => {
    if (!isSearching) {
      snapshotPreSearch({
        results: searchResults,
        currentPage,
        showPropertyModals,
      });
      searchAbortControllerRef.current = new AbortController();
      if (onSearchProperties) {
        await onSearchProperties();
      } else {
        await map.runIsochroneSearch();
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
  ]);

  const handleCancelSearch = useCallback(() => {
    searchAbortControllerRef.current?.abort();
    const restored = restorePreSearch();
    if (restored) {
      setSearchResults(restored.results);
      setCurrentPage(restored.currentPage);
      setShowPropertyModals(restored.showPropertyModals);
    }
  }, [restorePreSearch, setSearchResults, setCurrentPage, setShowPropertyModals]);

  const memoizedSearchFunction = useCallback(async () => {
    if (!isSearching) {
      await map.runIsochroneSearch();
    }
  }, [isSearching, map]);

  useEffect(() => {
    if (!searchRefresh?.setTriggerRefresh) return;
    searchRefresh.setTriggerRefresh(() => {
      feedScrollRef.current?.scrollToIndex({ index: 0, behavior: "smooth" });
      void invalidateSearchAndFeed();
    });
    return () => searchRefresh.setTriggerRefresh(null);
  }, [searchRefresh, invalidateSearchAndFeed]);

  // Trigger map resize when switching back to map so it repaints (stays preloaded but was hidden)
  useEffect(() => {
    if (searchViewMode === "map") {
      const t = setTimeout(() => map.triggerMapResize(), 50);
      return () => clearTimeout(t);
    }
  }, [searchViewMode, map]);

  useEffect(() => {
    if (searchRef) {
      searchRef.current = { triggerSearch: memoizedSearchFunction };
    }
  }, [searchRef, memoizedSearchFunction]);

  // Mount/unmount logging for navigation debugging
  useEffect(() => {
    log.info(LOG_CATEGORIES.ROUTING, "[SEARCH] SearchFeature mounted", {
      mode: searchViewMode,
      activeTab,
      resultsCount: filteredSearchResults.length,
      savedCount: savedHomes.length,
    });
    return () => {
      log.info(LOG_CATEGORIES.ROUTING, "[SEARCH] SearchFeature unmounted", {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount logging only; adding deps would log on every navigation/result change
  }, []);

  // Self-cleanup when leaving /search: abort in-flight search so no state updates after unmount
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        log.debug(LOG_CATEGORIES.ROUTING, "[SEARCH] Aborting in-flight search on unmount", {});
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  const { isCompactHeader, headerProps } = useSearchMobileHeaderActions({
    isSearching,
    onPreferencesChanged: handleSearchUpdated,
    onSearch: handleSearchUpdated,
    onCancelSearch: handleCancelSearch,
    selectedClientId,
    onClientChange: setSelectedClientId,
    mode: searchViewMode,
    onToggleMode: handleToggleMode,
    onBeforeSwitchToReels: handlers.handleBeforeSwitchToReels,
  });

  const mobileHeaderNode = useMemo(
    () =>
      isCompactHeader && searchViewMode === "map" ? <SearchMobileHeader {...headerProps} /> : null,
    [isCompactHeader, headerProps, searchViewMode]
  );

  useEffect(() => {
    setMobileHeaderActions(mobileHeaderNode);
    return () => setMobileHeaderActions(null);
  }, [mobileHeaderNode, setMobileHeaderActions]);

  return (
    <div className="relative h-full">
      {/* Reels mode: Search icon to go back to map */}
      {searchViewMode === "reels" && (
        <div className="absolute right-4 top-4 z-30 flex items-center md:flex">
          <IconButton
            variant="ghost"
            size="md"
            iconName="search"
            onClick={handleToggleMode}
            label="Back to search"
            className={`bg-black/40 text-white backdrop-blur-sm ${FEED_ACTION_INTERACTION_CLASS}`}
          />
        </div>
      )}

      {/* Both views stay mounted so the map stays preloaded; visibility toggles for instant switch */}
      <div className="relative h-full">
        <div
          className={`absolute inset-0 h-full ${searchViewMode === "map" ? "z-10" : "pointer-events-none invisible z-0"}`}
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
            onViewPropertyDetails={handlers.handleViewPropertyDetails}
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
            onPreferencesChanged={handleSearchUpdated}
            onSearchProperties={handleSearchUpdated}
            onCancelSearch={handleCancelSearch}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            isLoadingPropertyDetails={isLoadingPropertyDetails}
            isLoadingSearchResults={isLoadingSearchResults}
            isLoadingIsochrone={isLoadingIsochrone}
            isochroneData={isochroneData}
          />
        </div>
        <div
          className={`absolute inset-0 h-full ${searchViewMode === "reels" ? "z-10" : "pointer-events-none invisible z-0"}`}
          aria-hidden={searchViewMode !== "reels"}
        >
          <MotionView
            key="reels"
            className="h-full"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DesktopReelsView virtuosoRef={feedScrollRef} />
          </MotionView>
        </div>
      </div>

      <SearchPageModals
        selectedProperty={selectedProperty}
        onClosePropertyDetails={clearSelectedProperty}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
      />
    </div>
  );
}
