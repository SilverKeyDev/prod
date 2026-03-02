import React, { useCallback, useMemo } from "react";

import type { ListRenderItem } from "react-native";
import { FlatList, StyleSheet, View } from "react-native";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import type { SearchResult } from "@/features/search/types";

import type { SearchPageMapViewProps } from "./SearchPageMapView";

type MapProperty = SearchResult;

type NativeSearchPageMapViewProps = SearchPageMapViewProps;

export function SearchPageMapView(props: NativeSearchPageMapViewProps): JSX.Element {
  const {
    activeTab,
    onTabChange,
    filteredSearchResults,
    savedHomes,
    onViewPropertyDetails,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    isSearching,
    hasSearched,
    searchStage,
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
      const saved = isHomeSaved(
        item.id,
        typeof item.address === "string" ? item.address : undefined
      );

      return (
        <Pressable
          className="mb-3 rounded-lg border border-gray-200 bg-white p-3"
          onPress={() => onViewPropertyDetails(item)}
        >
          <Box className="flex-row items-center justify-between">
            <Box className="flex-1 pr-3">
              <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
                {item.address}
              </Text>
              <Text className="text-olive mt-1 text-sm">{item.price}</Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {item.bedrooms} bed · {item.bathrooms} bath
              </Text>
            </Box>
            <Pressable
              onPress={() =>
                saved
                  ? removeSavedHome(
                      item.id,
                      typeof item.address === "string" ? item.address : undefined
                    )
                  : saveHome(item)
              }
              className="border-brand-accent self-start rounded-lg border px-3 py-1.5"
            >
              <Text className="text-brand-accent text-sm">{saved ? "Unsave" : "Save"}</Text>
            </Pressable>
          </Box>
        </Pressable>
      );
    },
    [isHomeSaved, onViewPropertyDetails, removeSavedHome, saveHome]
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <Box className="absolute left-4 right-4 top-4 rounded-xl bg-black/40 px-4 py-3">
          <Text className="text-xs font-medium text-white">
            Map preview based on your search preferences
          </Text>
          {isSearching ? (
            <Text className="mt-1 text-xs text-gray-100">
              {searchStage ? searchStage : "Searching for homes..."}
            </Text>
          ) : hasSearched ? (
            <Text className="mt-1 text-xs text-gray-100">
              {properties.length > 0
                ? `${properties.length} homes in your search area`
                : "No homes found in this area yet"}
            </Text>
          ) : null}
        </Box>
        <Box className="h-full w-full items-center justify-center bg-emerald-50">
          <Text className="text-xs font-medium text-emerald-900">
            Native map integration is ready for a drop-in MapView.
          </Text>
          <Text className="mt-1 text-xs text-emerald-800">
            Markers and results stay in sync with web search state.
          </Text>
        </Box>
      </View>

      <Box className="bg-white">
        <Box className="mx-4 mt-3 flex-row rounded-full bg-gray-100 p-1">
          <Pressable
            onPress={() => handleTabPress("results")}
            className={`flex-1 rounded-full px-3 py-2 ${
              activeTab === "results" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-center text-xs font-medium ${
                activeTab === "results" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Results
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress("saved")}
            className={`flex-1 rounded-full px-3 py-2 ${
              activeTab === "saved" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-center text-xs font-medium ${
                activeTab === "saved" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Saved
            </Text>
          </Pressable>
        </Box>

        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text className="text-center text-sm text-gray-600">
                {hasSearched
                  ? "No homes match your search yet. Try adjusting your preferences."
                  : "Run a search to see homes that match your profile."}
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
});
