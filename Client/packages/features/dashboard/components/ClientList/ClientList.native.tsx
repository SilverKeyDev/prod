import React, { useCallback, useMemo, useState } from "react";

import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from "react-native";

import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

type DashboardClientNavigation = NativeStackNavigationProp<
  ParamListBase & {
    ClientHub: { clientId: string };
  }
>;

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

export function useClientListData() {
  const { clients, isLoading, error, refetch } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const navigation = useNavigation<DashboardClientNavigation>();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStage, setFilterStage] = useState<DealStage | "all">("all");
  const [hasRiskFlags, setHasRiskFlags] = useState<"all" | "has" | "none">("all");

  const enhancedClients = useMemo<ClientDealInfo[]>(() => {
    if (!clients.length) return [];

    const stages: ClientDealInfo["deal_stage"][] = [
      "search",
      "touring",
      "offer",
      "under_contract",
      "closing",
    ];

    return clients.map((client, index) => {
      const stage = stages[index % stages.length];
      return enhanceClientWithDealInfo(client, stage);
    });
  }, [clients, enhanceClientWithDealInfo]);

  const filteredClients = useMemo<ClientDealInfo[]>(() => {
    return enhancedClients.filter((client) => {
      if (filterStage !== "all" && client.deal_stage !== filterStage) {
        return false;
      }

      const riskCount = client.risk_flags?.length ?? 0;

      if (hasRiskFlags === "has" && riskCount === 0) {
        return false;
      }

      if (hasRiskFlags === "none" && riskCount > 0) {
        return false;
      }

      return true;
    });
  }, [enhancedClients, filterStage, hasRiskFlags]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleClientPress = useCallback(
    (clientId: string) => {
      navigation.navigate("ClientHub", { clientId });
    },
    [navigation]
  );

  const renderItem: ListRenderItem<ClientDealInfo> = useCallback(
    ({ item }) => {
      const riskCount = item.risk_flags?.length ?? 0;
      const stageLabel = item.deal_stage.replace(/_/g, " ");

      return (
        <Pressable
          onPress={() => handleClientPress(item.id)}
          className="mb-3 rounded-lg border border-gray-200 bg-white p-3"
        >
          <Box className="flex-row items-center justify-between gap-3">
            <Box className="flex-1">
              <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="mt-1 text-xs text-gray-600" numberOfLines={1}>
                {item.email}
              </Text>
            </Box>
            <Box className="items-end">
              <Text className="text-xs font-semibold uppercase text-gray-700">{stageLabel}</Text>
              {riskCount > 0 ? (
                <Text className="mt-1 text-xs text-rose-600">
                  {riskCount} risk{riskCount > 1 ? "s" : ""} flagged
                </Text>
              ) : (
                <Text className="mt-1 text-xs text-emerald-600">No risks</Text>
              )}
            </Box>
          </Box>
        </Pressable>
      );
    },
    [handleClientPress]
  );

  return {
    filteredClients,
    renderItem,
    keyExtractor: (item: ClientDealInfo) => item.id,
    loading: isLoading,
    error,
    refreshing,
    onRefresh,
    filterStage,
    setFilterStage,
    hasRiskFlags,
    setHasRiskFlags,
    enhancedClients,
  };
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
