import React, { useMemo, useState } from "react";

import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import ClientRow from "./ClientRow";

type ClientListProps = {
  onClientClick?: (clientId: string) => void;
};

const ClientList: React.FC<ClientListProps> = ({ onClientClick }) => {
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const [refreshing, setRefreshing] = useState(false);

  // Enhance clients with deal info (mock for now)
  const enhancedClients = useMemo<ClientDealInfo[]>(() => {
    if (!clients.length) return [];

    const stages: DealStage[] = ["search", "touring", "offer", "under_contract", "closing"];
    return clients.map((client, index) => {
      const stage = stages[index % stages.length];
      return enhanceClientWithDealInfo(client, stage);
    });
  }, [clients, enhanceClientWithDealInfo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here
    setRefreshing(false);
  };

  if (isLoading && !refreshing && !enhancedClients.length) {
    return (
      <Box className="py-12 text-center">
        <Text className="text-text-secondary text-sm">Loading clients...</Text>
      </Box>
    );
  }

  if (!enhancedClients.length) {
    return (
      <Box className="py-12 text-center">
        <Text className="text-text-secondary text-sm">
          No clients yet. New clients will appear here as you start working with them.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      {/* Header */}
      <Text className="text-text-primary text-lg font-medium">Clients</Text>

      {/* Client List */}
      <ScrollView refreshing={refreshing} onRefresh={handleRefresh}>
        <Box className="gap-3">
          {enhancedClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onClick={() => onClientClick?.(client.id)}
            />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
};

export default ClientList;
