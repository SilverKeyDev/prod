import React, { useMemo, useState } from "react";

import type { AgentClient } from "packages/api";
import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import ClientRow from "./ClientRow";

function pipelineStageToDealStage(pipeline: AgentClient["pipeline_stage"]): DealStage {
  switch (pipeline) {
    case "offer":
      return "offer";
    case "closing":
      return "closing";
    case "escrow":
    case "financing":
    case "insurance":
      return "under_contract";
    case "search":
    case "unknown":
    default:
      return "search";
  }
}

type ClientListProps = {
  onClientClick?: (clientId: string) => void;
};

const ClientList: React.FC<ClientListProps> = ({ onClientClick }) => {
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const [refreshing, setRefreshing] = useState(false);

  const enhancedClients = useMemo<ClientDealInfo[]>(() => {
    if (!clients.length) return [];

    return clients.map((client) =>
      enhanceClientWithDealInfo(client, pipelineStageToDealStage(client.pipeline_stage))
    );
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
            <ClientRow key={client.id} client={client} onClick={() => onClientClick?.(client.id)} />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
};

export default ClientList;
