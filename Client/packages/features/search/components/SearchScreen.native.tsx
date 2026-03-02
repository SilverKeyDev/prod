import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { searchApi } from "packages/features/search/api/search";
import { useSearchPageData } from "packages/features/search/hooks/data/page/useSearchPageData";
import type { SearchResult } from "packages/features/search/types";
import { transformSearchResponse } from "packages/features/search/utils/searchTransform";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useSearchViewStore } from "packages/store";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

import { SearchPageMapView } from "./layout/SearchPageMapView";

export function SearchScreenNative() {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);

  const data = useSearchPageData();
  const {
    filteredSearchResults,
    savedHomes,
    searchResults,
    setSearchResults,
    setIsSearching,
    setSearchStage,
    setHasSearched,
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
  } = data;

  const [refreshing, setRefreshing] = useState(false);

  const runSearch = useCallback(async () => {
    log.info(LOG_CATEGORIES.SEARCH, "Mobile search runSearch start", {
      perBucketPages: 20,
      forceSearch: true,
    });
    setIsSearching(true);
    setSearchStage("Searching...");
    setSearchResults([]);
    try {
      const response = await searchApi.searchByPolygon({
        perBucketPages: 20,
        forceSearch: true,
      });
      const results = transformSearchResponse(response);
      setSearchResults(results);
      setHasSearched(true);
      log.info(LOG_CATEGORIES.SEARCH, "Mobile search runSearch success", {
        resultCount: results.length,
      });
    } catch (error) {
      setSearchStage("Search failed");
      log.error(LOG_CATEGORIES.SEARCH, "Mobile search runSearch failed", error);
    } finally {
      setIsSearching(false);
    }
  }, [setSearchResults, setIsSearching, setSearchStage, setHasSearched]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runSearch();
    setRefreshing(false);
  }, [runSearch]);

  const renderItem: ListRenderItem<SearchResult> = useCallback(
    ({ item }) => {
      const saved = isHomeSaved(item.id);
      return (
        <Pressable className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text className="text-xs text-gray-400">No image</Text>
            </View>
          )}
          <Box className="mt-2">
            <Text
              className="text-base font-medium text-gray-900"
              numberOfLines={2}
            >
              {item.address}
            </Text>
            <Text className="text-olive mt-1 text-sm">{item.price}</Text>
            <Text className="mt-0.5 text-xs text-gray-500">
              {item.bedrooms} bed · {item.bathrooms} bath
            </Text>
            <Pressable
              onPress={() =>
                saved ? removeSavedHome(item.id) : saveHome(item)
              }
              className="border-brand-accent mt-2 self-start rounded-lg border px-3 py-1.5"
            >
              <Text className="text-brand-accent text-sm">
                {saved ? "Unsave" : "Save"}
              </Text>
            </Pressable>
          </Box>
        </Pressable>
      );
    },
    [isHomeSaved, saveHome, removeSavedHome],
  );

  const listData = useMemo(() => {
    return activeTab === "results" ? filteredSearchResults : savedHomes;
  }, [activeTab, filteredSearchResults, savedHomes]);

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
      <Box className="flex-row gap-2 px-4 py-3">
        <Input
          placeholder="Search by preferences..."
          editable={false}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
        />
        <Pressable
          onPress={toggleMode}
          className="justify-center rounded-lg border border-gray-200 bg-white px-3 py-3"
        >
          <Text className="text-sm font-medium text-gray-800">
            {mode === "map" ? "Map" : "Reels"}
          </Text>
        </Pressable>
        <Pressable
          onPress={runSearch}
          disabled={isSearching}
          className="bg-brand-accent justify-center rounded-lg px-4 py-3"
        >
          <Text className="font-medium text-white">
            {isSearching ? "..." : "Search"}
          </Text>
        </Pressable>
      </Box>

      {mode === "map" ? (
        <SearchPageMapView
          activeTab={activeTab}
          onTabChange={handleTabChange}
          filteredSearchResults={filteredSearchResults}
          savedHomes={savedHomes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onViewPropertyDetails={() => {
            // Property details modals are handled on web; mobile can add a native details flow later.
          }}
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
          onCancelSearch={() => {
            setIsSearching(false);
            setSearchStage("");
          }}
          selectedClientId={null}
          onClientChange={() => {}}
          isLoadingPropertyDetails={isLoadingPropertyDetails}
          isLoadingSearchResults={isLoadingSearchResults}
          isLoadingIsochrone={isLoadingIsochrone}
          isochroneData={null}
        />
      ) : isSearching && listData.length === 0 ? (
        <View style={styles.centered}>
          <Loading />
          {searchStage ? (
            <Text className="mt-4 text-sm text-gray-600">{searchStage}</Text>
          ) : null}
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
                Tap Search to find homes based on your profile preferences, or
                switch to the Saved tab to see homes you have already saved.
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
