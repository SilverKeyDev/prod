import React, { useCallback, useEffect, useMemo } from "react";

import type { ListRenderItem } from "react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ConnectedCardHeartSave } from "packages/features/search";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import type { SearchResult } from "@/features/search/types";

import { SearchPageMapContainerNative } from "./SearchPageMapContainer.native";
import type { SearchPageMapViewProps } from "./SearchPageMapView";

/**
 * Uses React Native's Pressable + StyleSheet (not the primitive with className)
 * so we avoid CssInterop in this tree and prevent "Couldn't find a navigation context"
 * when content is rendered inside map/portal-like hierarchies.
 */

const PROPERTIES_PER_PAGE = 1;

type MapProperty = SearchResult;

type NativeSearchPageMapViewProps = SearchPageMapViewProps;

export function SearchPageMapView(props: NativeSearchPageMapViewProps): JSX.Element {
  const {
    activeTab,
    onTabChange,
    filteredSearchResults,
    savedHomes,
    currentPage,
    setCurrentPage,
    onViewPropertyDetails,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    isSearching,
    hasSearched,
    searchStage,
    mapZoomIn,
    mapZoomOut,
  } = props;

  const properties = useMemo<MapProperty[]>(() => {
    return activeTab === "results" ? filteredSearchResults : savedHomes;
  }, [activeTab, filteredSearchResults, savedHomes]);

  const handleTabPress = useCallback(
    (tab: "results" | "saved") => {
      if (tab !== activeTab) {
        onTabChange(tab);
      }
    },
    [activeTab, onTabChange]
  );

  const renderPropertyItem: ListRenderItem<MapProperty> = useCallback(
    ({ item }) => {
      return (
        <Pressable style={styles.propertyCard} onPress={() => onViewPropertyDetails(item)}>
          <View style={styles.propertyCardRow}>
            <View style={styles.propertyCardContent}>
              <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
                {item.address}
              </Text>
              <Text className="text-olive mt-1 text-sm">{item.price}</Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {item.bedrooms} bed · {item.bathrooms} bath
              </Text>
            </View>
            <ConnectedCardHeartSave property={item} size="sm" />
          </View>
        </Pressable>
      );
    },
    [onViewPropertyDetails]
  );

  useEffect(() => {
    log.info(LOG_CATEGORIES.MAP_RENDERING, "SearchPageMapView render", {
      activeTab,
      propertyCount: properties.length,
      isSearching,
      hasSearched,
    });
  }, [activeTab, hasSearched, isSearching, properties.length]);

  const total = properties.length;
  const isLoading = isSearching && !hasSearched && properties.length === 0;
  const focusedIndex = Math.min(currentPage, Math.max(0, properties.length - 1));

  const handleMarkerSelect = useCallback(
    (index: number) => {
      setCurrentPage(index);
    },
    [setCurrentPage]
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <SearchPageMapContainerNative
          isLoading={isLoading}
          loadingMessage={
            searchStage ??
            SEARCH_TRANSLATIONS["search.searching_properties"] ??
            "Searching properties..."
          }
          page={currentPage}
          total={total}
          perPage={PROPERTIES_PER_PAGE}
          onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
          onNext={() => setCurrentPage(Math.min(currentPage + 1, Math.max(0, total - 1)))}
          onZoomIn={mapZoomIn}
          onZoomOut={mapZoomOut}
          disabled={!hasSearched}
          isSearching={isSearching}
          properties={properties}
          focusedIndex={focusedIndex}
          onMarkerSelect={handleMarkerSelect}
        />
      </View>

      <Box className="bg-white">
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => handleTabPress("results")}
            style={[styles.tab, activeTab === "results" && styles.tabActive]}
          >
            <Text
              className={
                activeTab === "results"
                  ? "text-center text-xs font-medium text-gray-900"
                  : "text-center text-xs font-medium text-gray-500"
              }
            >
              {SEARCH_TRANSLATIONS["search.search_tab"] ?? "Results"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress("saved")}
            style={[styles.tab, activeTab === "saved" && styles.tabActive]}
          >
            <Text
              className={
                activeTab === "saved"
                  ? "text-center text-xs font-medium text-gray-900"
                  : "text-center text-xs font-medium text-gray-500"
              }
            >
              {SEARCH_TRANSLATIONS["search.saved_tab"] ?? "Saved"}
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text className="text-center text-sm text-gray-600">
                {hasSearched
                  ? (SEARCH_TRANSLATIONS["search.no_results_try_adjusting"] ??
                    "No homes match your search yet. Try adjusting your preferences.")
                  : (SEARCH_TRANSLATIONS["search.run_search_to_see_homes"] ??
                    "Run a search to see homes that match your profile.")}
              </Text>
            </View>
          }
        />
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1.1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  propertyCard: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 1)",
    backgroundColor: "#fff",
    padding: 12,
  },
  propertyCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  propertyCardContent: {
    flex: 1,
    paddingRight: 12,
  },
  tabContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    borderRadius: 9999,
    backgroundColor: "rgba(243, 244, 246, 1)",
    padding: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
