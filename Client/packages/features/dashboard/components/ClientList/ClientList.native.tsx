import React, { useCallback, useMemo, useState } from "react";

import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from "react-native";

import type { ClientDealInfo } from "packages/schemas/agent";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

type DashboardClientNavigation = NativeStackNavigationProp<
  ParamListBase & {
    ClientHub: { clientId: string };
  }
>;

export function ClientListNative() {
  const { clients, isLoading, error, refetch } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const navigation = useNavigation<DashboardClientNavigation>();
  const [refreshing, setRefreshing] = useState(false);

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

  if (isLoading && !refreshing && !clients.length) {
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
    <FlatList
      data={enhancedClients}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="rgba(163, 177, 138, 1)"
        />
      }
    />
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
