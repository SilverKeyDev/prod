import { useCallback, useMemo, useRef } from "react";

import { useLocalization, useSearchRefresh } from "packages/contexts";
import { useAgentSyncPreferencesWhenClientSelected } from "packages/features/agent/hooks/data/search/useAgentSyncPreferencesWhenClientSelected";
import { FEED_ACTION_INTERACTION_CLASS } from "packages/features/feed";
import {
  cleanupMapPropertyCard,
  renderMapPropertyCard,
} from "packages/features/search/components/cards/MapPropertyCardUtils";
import { useSearchPageMap } from "packages/features/search/hooks/data/page/map/useSearchPageMap";
import { useLastSearchPersistence } from "packages/features/search/hooks/data/page/useLastSearchPersistence";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import { useSearchPageHandlers } from "packages/features/search/hooks/data/page/useSearchPageHandlers";
import type { Property } from "packages/features/search/hooks/data/property/usePropertyDetails";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useSearchViewIntegration } from "packages/features/search/hooks/store/useSearchViewIntegration";
import { useAgentSearchShareSelection } from "packages/features/search/hooks/ui/screen/useAgentSearchShareSelection";
import { useSearchMobileHeaderActions } from "packages/features/search/hooks/ui/screen/useSearchMobileHeaderActions";
import type { SearchResult } from "packages/features/search/types";
import { useSearchRefreshIntegration } from "packages/hooks/data/integrations/useSearchRefreshIntegration";
import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useActiveWorkspace } from "packages/hooks/store";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { useMediaQuery } from "packages/hooks/ui/responsive/useMediaQuery";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import {
  useAgentDashboardStore,
  useAuthStore,
  useFiltersStore,
  useSearchContextStore,
  useSearchViewStore,
} from "packages/store";
import { screenDown } from "packages/ui/types/screens";

import { userPreferencesHasImportantLocations } from "./useSearchFeatureController.helpers";
import { useSearchFeatureLifecycle } from "./useSearchFeatureLifecycle";
import { useSearchFeaturePreciseAddressNavigation } from "./useSearchFeaturePreciseAddressNavigation";

export type SearchFeatureControllerProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  onSearchProperties?: () => Promise<void>;
  searchRef?: React.MutableRefObject<{
    triggerSearch: () => Promise<void>;
  } | null>;
};

export function useSearchFeatureController({
  setMobileHeaderActions: _setMobileHeaderActions,
  onSearchProperties,
  searchRef,
}: SearchFeatureControllerProps) {
  const isCompactHeader = useMediaQuery(screenDown("lg"));
  const { t } = useLocalization();
  const isAgentWorkspace = useActiveWorkspace() === "agent";
  const { mode: searchViewMode } = useSearchViewIntegration();
  const toggleMode = useSearchViewStore((s) => s.toggleMode);
  const searchRefresh = useSearchRefresh();
  const { invalidateSearchAndFeed } = useSearchRefreshIntegration();
  const feedScrollRef = useRef<unknown>(null);
  const setAnchor = useSearchContextStore((s) => s.setAnchor);
  const locationBarDraft = useSearchContextStore((s) => s.locationBarDraft);
  const locationBarExternalSubmit = useSearchContextStore((s) => s.locationBarExternalSubmit);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);
  useAgentSyncPreferencesWhenClientSelected(selectedClientId);
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
    () => userPreferencesHasImportantLocations(userPreferences?.important_locations),
    [userPreferences?.important_locations]
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

  const agentShareSelection = useAgentSearchShareSelection(filteredSearchResults);

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

  const handlePreciseStreetAddressSelected =
    useSearchFeaturePreciseAddressNavigation(handleViewPropertyDetails);

  const handleToggleMode = useCallback(() => {
    if (searchViewMode === "map") {
      handleBeforeSwitchToReels();
    }
    toggleMode();
  }, [searchViewMode, toggleMode, handleBeforeSwitchToReels]);

  const map = useSearchPageMap({
    searchViewMode,
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
    onMarkerClick: handlers.handleFocusPropertyOnMap,
    onMapPreviewNavigate: handlers.handleNavigateToProperty,
    onUnlockClick: handleViewPropertyDetails,
    onOpenDetails: handlers.handleOpenPropertyDetails,
    getSearchAbortSignal: () => searchAbortControllerRef.current?.signal,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    preferencesSubjectUserId: selectedClientId,
    importantLocations: userPreferences?.important_locations,
    saveLastSearchContext,
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
      if (searchViewMode === "map") {
        requestAnimationFrame(() => {
          void map.updateMapMarkers(nextData);
        });
      }
    },
    [setActiveTab, setCurrentPage, filteredSearchResults, savedHomes, map, searchViewMode]
  );

  const handleLocationSearchSubmit = useCallback(async () => {
    if (isSearching) return;
    setSearchSource("location");
    snapshotPreSearch({
      results: searchResults,
      currentPage,
      showPropertyModals,
    });
    searchAbortControllerRef.current?.abort();
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

  const handleSearchUpdated = useCallback(
    async (options?: { skipLocationsGate?: boolean }) => {
      if (isSearching) return;

      const skipLocationsGate = options?.skipLocationsGate === true;

      if (!hasLocations && !skipLocationsGate) {
        if (!locationBarDraft.trim()) {
          showWarningToast(t("search.need_locations_or_place"));
          return;
        }
        if (!locationBarExternalSubmit) {
          showWarningToast(t("search.need_locations_or_place"));
          return;
        }
        await locationBarExternalSubmit();
        return;
      }

      setSearchSource("preferences");
      snapshotPreSearch({
        results: searchResults,
        currentPage,
        showPropertyModals,
      });
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = new AbortController();
      if (onSearchProperties) {
        setIsSearching(true);
        setSearchStage("Preparing search...");
        await onSearchProperties();
      } else {
        await map.runUnifiedSearch();
      }
    },
    [
      isSearching,
      hasLocations,
      locationBarDraft,
      locationBarExternalSubmit,
      t,
      onSearchProperties,
      map,
      searchResults,
      currentPage,
      showPropertyModals,
      snapshotPreSearch,
      setSearchSource,
      setIsSearching,
      setSearchStage,
    ]
  );

  const handleCancelSearch = useCallback(() => {
    searchAbortControllerRef.current?.abort();
    const restored = restorePreSearch();
    if (restored) {
      setSearchResults(restored.results);
      setCurrentPage(restored.currentPage);
      setShowPropertyModals(restored.showPropertyModals);
    }
  }, [restorePreSearch, setSearchResults, setCurrentPage, setShowPropertyModals]);

  const memoizedSearchFunction = handleSearchUpdated;

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

  const { headerProps } = useSearchMobileHeaderActions({
    isCompactHeader,
    isSearching,
    onSearch: handleSearchUpdated,
    onLocationSearchSubmit: handleLocationSearchSubmit,
    fitMapToBounds: map.fitMapToBounds,
    onPreciseStreetAddressSelected: handlePreciseStreetAddressSelected,
    onCancelSearch: handleCancelSearch,
    hasLocations,
    selectedClientId,
    onClientChange: setSelectedClientId,
    mode: searchViewMode,
    onToggleMode: handleToggleMode,
    onBeforeSwitchToReels: handleBeforeSwitchToReels,
  });

  return {
    FEED_ACTION_INTERACTION_CLASS,
    isAgent: isAgentWorkspace,
    searchViewMode,
    handleToggleMode,
    activeTab,
    handleTabChange,
    filteredSearchResults,
    savedHomes,
    currentPage,
    setCurrentPage,
    handleViewPropertyDetails,
    handlers,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    isCarouselCollapsed,
    setIsCarouselCollapsed,
    isSearching,
    hasSearched: data.hasSearched,
    searchResults,
    searchStage,
    map,
    setShowPropertyModals,
    setHasSearched,
    selectedProperty,
    clearSelectedProperty,
    isLoadingPropertyDetails,
    isLoadingSearchResults,
    isLoadingIsochrone,
    displayIsochroneData,
    hasLocations,
    handleSearchUpdated,
    handleLocationSearchSubmit,
    handleCancelSearch,
    handlePreciseStreetAddressSelected,
    selectedClientId,
    setSelectedClientId,
    showCommuteOverlay,
    mapHomeCardsCount,
    agentShareSelection,
    feedScrollRef,
    handleBeforeSwitchToReels,
    isCompactHeader,
    headerProps,
  };
}
