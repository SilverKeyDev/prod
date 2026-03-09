import { useCallback, useMemo, useState } from "react";

import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ListRenderItem } from "react-native";

import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

type DashboardClientNavigation = NativeStackNavigationProp<
  ParamListBase & {
    ClientHub: { clientId: string };
  }
>;

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
