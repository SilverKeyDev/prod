import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { FlatList, Image, ListRenderItem, RefreshControl, StyleSheet, View } from "react-native";

import { ConnectedCardHeartSave } from "packages/features/search";
import { searchPropertiesInIsochrone } from "packages/features/search/api/propertySearch";
import { searchApi } from "packages/features/search/api/search";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import type { SearchResult } from "packages/features/search/types";
import { formatAddress } from "packages/features/search/types/search/propertyDetailsFormatters";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useSearchRefreshIntegration } from "packages/hooks/data/useSearchRefreshIntegration";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { usePreActionSnapshot } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useSearchContextStore, useSearchViewStore } from "packages/store";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import { SearchFiltersSheetNative } from "./header/SearchFiltersSheet.native";
import { SearchHeaderLocationsNative } from "./header/SearchHeaderLocations.native";
import { SearchPageMapView } from "./layout/SearchPageMapView";

export function SearchScreenNative() {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);

  /** Reels is desktop-only (SRCH-2). On native, when viewMode === "reels" we show list instead. */
  const effectiveViewMode: "map" | "list" = mode === "reels" ? "list" : mode;

  const { userPreferences } = useUserPreferences();

  const { invalidateSearchAndFeed } = useSearchRefreshIntegration();
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

  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await invalidateSearchAndFeed();
    await runSearch();
    setRefreshing(false);
  }, [invalidateSearchAndFeed, runSearch]);

  const renderItem: ListRenderItem<SearchResult> = useCallback(
    ({ item }) => {
      return (
        <Pressable
          className="mb-3 rounded-lg border border-gray-200 bg-white p-3"
          onPress={() => handleViewPropertyDetails(item)}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text className="text-xs text-gray-400">No image</Text>
            </View>
          )}
          <Box className="mt-2 flex-row items-center justify-between">
            <Box className="flex-1">
              <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
                {item.address}
              </Text>
              <Text className="text-olive mt-1 text-sm">{item.price}</Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {item.bedrooms} bed · {item.bathrooms} bath
              </Text>
            </Box>
            <ConnectedCardHeartSave property={item} size="sm" />
          </Box>
        </Pressable>
      );
    },
    [handleViewPropertyDetails]
  );

  const listData = useMemo(() => {
    return activeTab === "results" ? filteredSearchResults : savedHomes;
  }, [activeTab, filteredSearchResults, savedHomes]);

  const filtersSummary = useMemo(() => {
    if (!userPreferences) return "";
    const minPrice = (userPreferences as { home_budget_min?: number }).home_budget_min ?? 100000;
    const maxPrice = (userPreferences as { home_budget_max?: number }).home_budget_max ?? 2000000;
    const minBeds = (userPreferences as { preferred_bedrooms?: number }).preferred_bedrooms ?? 0;
    const maxBeds =
      (userPreferences as { preferred_bedrooms_max?: number }).preferred_bedrooms_max ?? 8;
    const minBaths = (userPreferences as { preferred_bathrooms?: number }).preferred_bathrooms ?? 0;
    const maxBaths =
      (userPreferences as { preferred_bathrooms_max?: number }).preferred_bathrooms_max ?? 8;
    const priceSummary = `$${minPrice.toLocaleString()} – $${maxPrice.toLocaleString()}`;
    const bedsLabel = minBeds === 0 && maxBeds === 8 ? "Any beds" : `${minBeds}–${maxBeds} beds`;
    const bathsLabel =
      minBaths === 0 && maxBaths === 8 ? "Any baths" : `${minBaths}–${maxBaths} baths`;
    return `${priceSummary} · ${bedsLabel} · ${bathsLabel}`;
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
      navigation.navigate(
        "PropertyDetails" as never,
        {
          address: address || property.id,
          propertyId: property.id,
        } as never
      );
    },
    [navigation]
  );

  useEffect(() => {
    log.info(LOG_CATEGORIES.PAGES, "SearchScreenNative render", {
      mode,
      activeTab,
      isSearching,
      resultCount: listData.length,
    });
  }, [mode, activeTab, isSearching, listData.length]);

  return (
    <View style={styles.container}>
      <Box className="gap-2 px-4 py-3">
        <Box className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setFiltersSheetOpen(true)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-3"
          >
            <Text className="text-sm font-medium text-gray-800">
              {SEARCH_TRANSLATIONS["search.filters"] ?? "Filters"}
            </Text>
          </Pressable>
          <Pressable
            onPress={toggleMode}
            className="flex-1 justify-center rounded-lg border border-gray-200 bg-white px-3 py-3"
          >
            <Text className="text-center text-sm font-medium text-gray-800">
              {effectiveViewMode === "map"
                ? (SEARCH_TRANSLATIONS["search.map"] ?? "Map")
                : (SEARCH_TRANSLATIONS["search.list"] ?? "List")}
            </Text>
          </Pressable>
          <Pressable
            onPress={isSearching ? handleCancelSearch : runSearch}
            className="bg-brand-accent justify-center rounded-lg px-4 py-3"
          >
            <Text className="font-medium text-white">
              {isSearching
                ? (SEARCH_TRANSLATIONS["search.searching"] ?? "Searching...")
                : (SEARCH_TRANSLATIONS["search.search"] ?? "Search")}
            </Text>
          </Pressable>
        </Box>
        <SearchHeaderLocationsNative onPreferencesChanged={runSearch} />
      </Box>
      {filtersSummary ? (
        <Box className="px-4 pb-2">
          <Text className="text-xs text-gray-600" numberOfLines={2}>
            {filtersSummary}
          </Text>
        </Box>
      ) : null}
      <SearchFiltersSheetNative
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        onApply={() => {}}
      />

      {effectiveViewMode === "map" ? (
        <SearchPageMapView
          activeTab={activeTab}
          onTabChange={handleTabChange}
          filteredSearchResults={filteredSearchResults}
          savedHomes={savedHomes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onViewPropertyDetails={handleViewPropertyDetails}
          onNavigateToProperty={() => {
            // Current mobile implementation keeps list and map in sync via shared results; paging is handled locally.
          }}
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
      ) : isSearching && listData.length === 0 ? (
        <View style={styles.centered}>
          <Loading />
          {searchStage ? <Text className="mt-4 text-sm text-gray-600">{searchStage}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text className="text-gray-600">
                Tap Search to find homes based on your profile preferences, or switch to the Saved
                tab to see homes you have already saved.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="rgba(163, 177, 138, 1)"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  thumbnail: {
    width: "100%",
    height: 160,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: "rgba(243, 244, 246, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
