import React from "react";

import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import type { DealStage } from "packages/schemas/agent";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import { useClientListData } from "./useClientListData.native";

export type ClientListFilterUIProps = {
  filterStage: DealStage | "all";
  setFilterStage: (s: DealStage | "all") => void;
  hasRiskFlags: "all" | "has" | "none";
  setHasRiskFlags: (v: "all" | "has" | "none") => void;
};

export function ClientListFilterUI({
  filterStage,
  setFilterStage,
  hasRiskFlags,
  setHasRiskFlags,
}: ClientListFilterUIProps) {
  return (
    <Box className="mb-3 gap-2 rounded-lg bg-gray-50 p-2">
      <Text className="mb-1 text-xs font-semibold text-gray-700">Filter by stage</Text>
      <Box className="flex-row flex-wrap gap-2">
        {(["all", "search", "touring", "offer", "under_contract", "closing"] as const).map(
          (stage) => {
            const isActive = filterStage === stage;
            const label =
              stage === "all"
                ? "All"
                : (stage.replace(/_/g, " ") as string).replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  );

            return (
              <Pressable
                key={stage}
                onPress={() => setFilterStage(stage)}
                className={`rounded-full px-3 py-1.5 ${
                  isActive ? "bg-brand-accent" : "border border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${isActive ? "text-white" : "text-gray-800"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }
        )}
      </Box>

      <Text className="mb-1 mt-3 text-xs font-semibold text-gray-700">Risk flags</Text>
      <Box className="flex-row flex-wrap gap-2">
        {(["all", "has", "none"] as const).map((option) => {
          const isActive = hasRiskFlags === option;
          const labelMap: Record<typeof option | "all", string> = {
            all: "All",
            has: "With risk flags",
            none: "No risk flags",
          };
          const label = labelMap[option];

          return (
            <Pressable
              key={option}
              onPress={() => setHasRiskFlags(option)}
              className={`rounded-full px-3 py-1.5 ${
                isActive ? "bg-brand-accent" : "border border-gray-200 bg-white"
              }`}
            >
              <Text className={`text-xs font-medium ${isActive ? "text-white" : "text-gray-800"}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}

export function ClientListNative() {
  const {
    filteredClients,
    renderItem,
    keyExtractor,
    loading,
    error,
    refreshing,
    onRefresh,
    filterStage,
    setFilterStage,
    hasRiskFlags,
    setHasRiskFlags,
    enhancedClients,
  } = useClientListData();

  if (loading && !refreshing && !enhancedClients.length) {
    return (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text className="text-sm text-gray-600">{error}</Text>
        <Pressable onPress={onRefresh} className="bg-brand-accent mt-4 rounded-lg px-4 py-2">
          <Text className="text-sm font-medium text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!enhancedClients.length) {
    return (
      <View style={styles.centered}>
        <Text className="text-sm text-gray-600">
          No clients yet. New clients will appear here as you start working with them.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ClientListFilterUI
        filterStage={filterStage}
        setFilterStage={setFilterStage}
        hasRiskFlags={hasRiskFlags}
        setHasRiskFlags={setHasRiskFlags}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(163, 177, 138, 1)"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text className="text-sm text-gray-600">
              {filterStage !== "all" || hasRiskFlags !== "all"
                ? "No clients match your filters."
                : "No clients yet. New clients will appear here as you start working with them."}
            </Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 4,
  },
  centered: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ClientListNative;
