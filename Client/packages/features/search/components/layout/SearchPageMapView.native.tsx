import React, { useCallback, useEffect, useMemo } from "react";

import type { ListRenderItem } from "react-native";
import { FlatList, Pressable, StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import { ConnectedCardHeartSave } from "packages/features/search/components/ConnectedCardHeartSave";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import type { SearchResult } from "@/features/search/types";

import { SearchPageMapContainerNative } from "./SearchPageMapContainer.native";
import type { SearchPageMapViewProps } from "./SearchPageMapView";

/**
 * Uses React Native's Pressable + StyleSheet (not the primitive with className)
 * so we avoid CssInterop in this tree and prevent "Couldn't find a navigation context"
 * when content is rendered inside map/portal-like hierarchies.
 */

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
    isHomeSaved: _isHomeSaved,
    saveHome: _saveHome,
    removeSavedHome: _removeSavedHome,
    isSearching,
    hasSearched,
    searchStage,
    mapZoomIn,
    mapZoomOut,
    isochroneData,
    showCommuteOverlay = true,
    mapHomeCardsCount,
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
          <Box style={styles.propertyCardRow}>
            <Box style={styles.propertyCardContent}>
              <Text className="text-text-primary text-base font-medium" numberOfLines={2}>
                {item.address}
              </Text>
              <Text className="text-primary mt-1 text-sm">{item.price}</Text>
              <Text className="text-text-secondary mt-0.5 text-xs">
                {item.bedrooms} bed · {item.bathrooms} bath
              </Text>
            </Box>
            <ConnectedCardHeartSave property={item} size="sm" />
          </Box>
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
  const perPage = mapHomeCardsCount;
  const maxCardStart = Math.max(0, total - perPage);

  const handleMarkerSelect = useCallback(
    (index: number) => {
      setCurrentPage(index);
    },
    [setCurrentPage]
  );

  return (
    <Box style={styles.container}>
      <Box style={styles.mapContainer}>
        <SearchPageMapContainerNative
          isLoading={isLoading}
          loadingMessage={
            searchStage ??
            SEARCH_TRANSLATIONS["search.searching_properties"] ??
            "Searching properties..."
          }
          page={currentPage}
          total={total}
          perPage={perPage}
          onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
          onNext={() => setCurrentPage(Math.min(maxCardStart, currentPage + 1))}
          onZoomIn={mapZoomIn}
          onZoomOut={mapZoomOut}
          disabled={!hasSearched}
          isSearching={isSearching}
          properties={properties}
          onMarkerSelect={handleMarkerSelect}
          isochroneData={isochroneData}
          showCommuteOverlay={showCommuteOverlay}
        />
      </Box>

      <Box className="bg-background-surface">
        <Box style={styles.tabContainer}>
          <Pressable
            onPress={() => handleTabPress("results")}
            style={[styles.tab, activeTab === "results" && styles.tabActive]}
          >
            <Text
              className={
                activeTab === "results"
                  ? "text-text-primary text-center text-xs font-medium"
                  : "text-text-secondary text-center text-xs font-medium"
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
                  ? "text-text-primary text-center text-xs font-medium"
                  : "text-text-secondary text-center text-xs font-medium"
              }
            >
              {SEARCH_TRANSLATIONS["search.saved_tab"] ?? "Saved"}
            </Text>
          </Pressable>
        </Box>

        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Box style={styles.emptyContainer}>
              <Text className="text-text-secondary text-center text-sm">
                {hasSearched
                  ? (SEARCH_TRANSLATIONS["search.no_results_try_adjusting"] ??
                    "No homes match your search yet. Try adjusting your preferences.")
                  : (SEARCH_TRANSLATIONS["search.run_search_to_see_homes"] ??
                    "Run a search to see homes that match your profile.")}
              </Text>
            </Box>
          }
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    overflow: "hidden",
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
    backgroundColor: color("neutral.50"),
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
    backgroundColor: color("neutral.50"),
    shadowColor: color("neutral.900"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
