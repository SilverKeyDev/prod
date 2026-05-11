import React, { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient } from "packages/api";
import { useLocalization } from "packages/contexts";
import { ClientSearchModal } from "packages/features/agent/components/modals";
import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, ScrollView } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";
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
  const { t } = useLocalization();
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

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
      <Box className="py-5 text-center">
        <BodyText as="p" size="sm" className="text-text-secondary">
          {t("agent.loading_clients")}
        </BodyText>
      </Box>
    );
  }

  if (!enhancedClients.length) {
    return (
      <>
        <Box className="flex flex-col items-center gap-3 py-5 text-center">
          <Icon name="message-circle" className="h-12 w-12 text-neutral-400" />
          <Box className="max-w-sm space-y-1">
            <BodyText as="p" size="sm" className="text-neutral-600">
              {t("agent.no_clients_yet")}
            </BodyText>
            <BodyText as="p" size="xs" className="text-neutral-500">
              {t("agent.clients_appear_once_assigned")}
            </BodyText>
          </Box>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowSearchModal(true)}
          >
            {t("agent.search_for_clients")}
          </Button>
        </Box>
        <ClientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      </>
    );
  }

  return (
    <Box className="space-y-4">
      <Title as="h2" size="md" className="text-text-primary font-medium">
        {t("agent.clients")}
      </Title>

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
