import React, { useCallback, useState } from "react";

import { RefreshControl, ScrollView, StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import { Calendar, UpcomingEvents } from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { Box, Text } from "packages/ui/components/primitives";

import { ClientListNative } from "./ClientList/ClientList.native";
import { DashboardChecklistsNative } from "./DashboardChecklists/DashboardChecklists.native";

export function DashboardScreenNative() {
  const isAgent = useIsAgent();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={color("brand.accent")}
        />
      }
    >
      <Box className="gap-6 px-4 pb-8 pt-4">
        <Text className="text-xl font-semibold text-gray-900">Dashboard</Text>

        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Upcoming Events</Text>
          <UpcomingEvents />
        </Box>

        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Calendar</Text>
          <Calendar />
        </Box>

        <DashboardChecklistsNative />

        {isAgent ? (
          <Box className="gap-3">
            <Text className="text-lg font-medium text-gray-800">Clients</Text>
            <ClientListNative />
          </Box>
        ) : null}
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});
