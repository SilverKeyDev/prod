import React, { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient } from "packages/api";
import { useLocalization } from "packages/contexts";
import { ClientSearchModal } from "packages/features/agent/components/modals";
import Card from "packages/ui/components/structure/layout/Card.web";
import { Box, ScrollView } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";
import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import { sortAgentClients } from "@/features/agent/utils/agentClientListSort";
import { agentClientActionFromConversation } from "@/features/agent/utils/clientList/agentClientListRowHelpers";
import { useAgentChats } from "@/features/messaging";

import AgentClientListRow from "./AgentClientListRow";

type ClientListProps = {
  onClientClick?: (client: AgentClient) => void;
};

const ClientList: React.FC<ClientListProps> = ({ onClientClick }) => {
  const { t } = useLocalization();
  const { clients, isLoading } = useAgentClients();
  const { conversations } = useAgentChats();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );

  const sortedClients = useMemo(
    () =>
      sortAgentClients(clients, "recent", conversationMap, (client) =>
        agentClientActionFromConversation(client, conversationMap.get(client.id))
      ),
    [clients, conversationMap]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  if (isLoading && !refreshing && !sortedClients.length) {
    return (
      <Box className="py-5 text-center">
        <BodyText as="p" size="sm" className="text-text-secondary">
          {t("agent.loading_clients")}
        </BodyText>
      </Box>
    );
  }

  if (!sortedClients.length) {
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

      <ScrollView refreshing={refreshing} onRefresh={handleRefresh}>
        <Box className="gap-2.5">
          {sortedClients.map((client) => (
            <Card
              key={client.id}
              border="light"
              hover
              padding="none"
              className="cursor-pointer"
              onClick={() => onClientClick?.(client)}
            >
              <AgentClientListRow
                client={client}
                conversation={conversationMap.get(client.id)}
                variant="card"
                rowClassName="px-3 py-3"
              />
            </Card>
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
};

export default ClientList;
