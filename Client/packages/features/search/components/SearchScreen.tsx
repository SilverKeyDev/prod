import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "@ui/button/Button";

import { DesktopReelsView } from "packages/features/search";
import { searchPropertiesInIsochrone } from "packages/features/search/api/propertySearch";
import { searchApi } from "packages/features/search/api/search";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import type { SearchResult } from "packages/features/search/types";
import { formatAddress } from "packages/features/search/types/search/propertyDetailsFormatters";
import {
  formatPriceRange,
  getBedBathSummary,
} from "packages/features/search/types/search/searchFilterSummaries";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useSearchContextStore, useSearchViewStore } from "packages/store";
import { Box, Text } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { SearchFiltersSheet } from "./header/SearchFiltersSheet";
import { SearchHeaderLocations } from "./header/SearchHeaderLocations";
import { SearchPageMapView } from "./layout/SearchPageMapView";

export function SearchScreen() {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);

  const { userPreferences } = useUserPreferences();

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
    isochroneData,
  } = data;

  const navigation = useNavigation();

  const searchFilterOverrides = useSearchContextStore((s) => s.searchFilterOverrides);

  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const { snapshot: snapshotPreSearch, restore: restorePreSearch } = usePreActionSnapshot<{
    results: SearchResult[];
    currentPage: number;
    searchStage: string | null;
  }>("search_pre_cancel_snapshot");

  const runSearch = useCallback(async () => {
    if (isSearching) return;
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
      const response = await searchApi.getIsochrone();
      if (!response.success || !response.data) {
        log.warn(LOG_CATEGORIES.SEARCH, "Isochrone API returned no data", {
          success: response.success,
        });
        setSearchStage("No search area. Add important locations in Filters.");
        setIsSearching(false);
        return;
      }
      const raw = response.data as {
        isochrone?: { geometry?: { coordinates: number[][][] } };
        center?: { lat: number; lon?: number; lng?: number; address?: string; name?: string };
      };
      const isochroneData = {
        ...response.data,
        center: raw.center
          ? {
              ...raw.center,
              lng: raw.center.lon ?? raw.center.lng ?? 0,
            }
          : undefined,
      };
      await searchPropertiesInIsochrone(
        isochroneData,
        {},
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        async () => {},
        searchFilterOverrides,
        controller.signal
      );
      log.info(LOG_CATEGORIES.SEARCH, "Mobile search runSearch success (isochrone flow)", {});
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
    setCurrentPage,
    setHasSearched,
    setIsSearching,
    setSearchResults,
    setSearchStage,
    setShowPropertyModals,
    snapshotPreSearch,
  ]);

  const listData = useMemo(() => {
    return activeTab === "results" ? filteredSearchResults : savedHomes;
  }, [activeTab, filteredSearchResults, savedHomes]);

  const criteriaSummary = useMemo(() => {
    if (!userPreferences) return "";
    const minPrice = (userPreferences as { home_budget_min?: number }).home_budget_min ?? 100000;
    const maxPrice = (userPreferences as { home_budget_max?: number }).home_budget_max ?? 2000000;
    const minBeds = (userPreferences as { preferred_bedrooms?: number }).preferred_bedrooms ?? 0;
    const maxBeds =
      (userPreferences as { preferred_bedrooms_max?: number }).preferred_bedrooms_max ?? 8;
    const minBaths = (userPreferences as { preferred_bathrooms?: number }).preferred_bathrooms ?? 0;
    const maxBaths =
      (userPreferences as { preferred_bathrooms_max?: number }).preferred_bathrooms_max ?? 8;
    const priceSummary = formatPriceRange(minPrice, maxPrice);
    const bedBathSummary = getBedBathSummary(minBeds, maxBeds, minBaths, maxBaths);
    const locations = userPreferences?.important_locations as
      | Array<{ address?: string }>
      | undefined
      | null;
    const locationsList = Array.isArray(locations) ? locations : [];
    const firstAddress = locationsList[0]?.address?.trim() ?? "";
    const locationLabel =
      firstAddress.length > 18 ? `${firstAddress.slice(0, 15)}...` : firstAddress || "";
    const parts = [priceSummary, locationLabel, bedBathSummary].filter(Boolean);
    return parts.join(" · ");
  }, [userPreferences]);

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      log.info(LOG_CATEGORIES.SEARCH, "Mobile search tab change", {
        from: activeTab,
        to: tab,
      });
      setActiveTab(tab);
      setCurrentPage(0);
    },
    [activeTab, setActiveTab, setCurrentPage]
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

  useEffect(() => {
    log.info(LOG_CATEGORIES.PAGES, "SearchScreen render", {
      mode,
      activeTab,
      isSearching,
      resultCount: listData.length,
    });
  }, [mode, activeTab, isSearching, listData.length]);

  const headerBtnClass = `shrink-0 ${HEADER_ROW_HEIGHT}`;

  const handleSearchPress = useCallback(() => {
    if (isSearching) {
      handleCancelSearch();
      return;
    }
    if (!hasLocations) {
      showErrorToast(
        SEARCH_TRANSLATIONS["search.add_location_to_search"] ??
          "Add at least one location to search"
      );
      return;
    }
    void runSearch();
  }, [isSearching, hasLocations, handleCancelSearch, runSearch]);

  return (
    <Box className="flex-1">
      <Box className="gap-2 px-4 py-3">
        <Box className={`flex-row flex-wrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}>
          <Button
            variant="cancel"
            size="sm"
            iconName="sliders-horizontal"
            onPress={() => setFiltersSheetOpen(true)}
            className={headerBtnClass}
          >
            {SEARCH_TRANSLATIONS["search.filters"] ?? "Filters"}
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            iconName={isSearching ? undefined : "search"}
            loading={isSearching}
            onPress={handleSearchPress}
            className={headerBtnClass}
          >
            {isSearching
              ? (SEARCH_TRANSLATIONS["search.searching"] ?? "Searching...")
              : (SEARCH_TRANSLATIONS["search.search"] ?? "Search")}
          </Button>
          {isSearching ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleCancelSearch}
              className={headerBtnClass}
            >
              {SEARCH_TRANSLATIONS["common.cancel"] ?? "Cancel"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              iconName={mode === "map" ? "video" : "map"}
              onPress={toggleMode}
              className={headerBtnClass}
            >
              {mode === "map"
                ? (SEARCH_TRANSLATIONS["search.reels"] ?? "Reels")
                : (SEARCH_TRANSLATIONS["search.map"] ?? "Map")}
            </Button>
          )}
        </Box>
        <Box
          className={`min-h-0 flex-row items-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white px-3 ${HEADER_ROW_HEIGHT}`}
        >
          <Box className="min-h-0 min-w-0 flex-1 justify-center py-2">
            <Text className="text-sm text-gray-700" numberOfLines={1} ellipsizeMode="tail">
              {criteriaSummary || " "}
            </Text>
          </Box>
          <SearchHeaderLocations onPreferencesChanged={runSearch} compact />
        </Box>
      </Box>
      <SearchFiltersSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        onApply={() => {}}
      />

      {mode === "map" ? (
        <SearchPageMapView
          activeTab={activeTab}
          onTabChange={handleTabChange}
          filteredSearchResults={filteredSearchResults}
          savedHomes={savedHomes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onViewPropertyDetails={handleViewPropertyDetails}
          onNavigateToProperty={() => {}}
          isHomeSaved={isHomeSaved}
          saveHome={async (p) => {
            await saveHome(p);
          }}
          removeSavedHome={async (id, addr) => {
            await removeSavedHome(id, addr);
          }}
          isCarouselCollapsed={false}
          setIsCarouselCollapsed={() => {}}
          isSearching={isSearching}
          hasSearched={hasSearched}
          searchResults={searchResults}
          searchStage={searchStage}
          mapZoomIn={() => {}}
          mapZoomOut={() => {}}
          mobileMapRef={{ current: null }}
          desktopMapRef={{ current: null }}
          setShowPropertyModals={() => {}}
          setHasSearched={setHasSearched}
          selectedPropertyId={undefined}
          onPreferencesChanged={runSearch}
          onSearchProperties={runSearch}
          onCancelSearch={handleCancelSearch}
          selectedClientId={null}
          onClientChange={() => {}}
          isLoadingPropertyDetails={isLoadingPropertyDetails}
          isLoadingSearchResults={isLoadingSearchResults}
          isLoadingIsochrone={isLoadingIsochrone}
          isochroneData={isochroneData}
        />
      ) : (
        <DesktopReelsView />
      )}
    </Box>
  );
}
