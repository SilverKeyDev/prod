import { useMemo } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import AgentClientListRow from "packages/features/agent/components/clientList/AgentClientListRow";
import { Box } from "packages/ui/components/structure/primitives";
import { SidebarInsetListSelectionStripe } from "packages/ui/components/structure/sidebar/SidebarInsetListSelectionStripe";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
  sidebarInsetListRowSelectedProps,
} from "packages/ui/components/structure/sidebar/sidebarTheme";
import { getMessagePreview } from "packages/utils/comms/messaging/messagePreview";

import { BodyText, KeyTurnLoader } from "@/components/ui";
import { sortAgentClients } from "@/features/agent/utils/agentClientListSort";
import { agentClientActionFromConversation } from "@/features/agent/utils/clientList/agentClientListRowHelpers";

type AgentMessagingClientListProps = {
  clients: AgentClient[];
  conversations: AgentConversation[];
  isLoadingClients: boolean;
  selectedClientId: string | null;
  onClientSelect?: (clientId: string) => void;
  setIsSidebarExpanded: (expanded: boolean) => void;
  emptyMessage: string;
};

export default function AgentMessagingClientList({
  clients,
  conversations,
  isLoadingClients,
  selectedClientId,
  onClientSelect,
  setIsSidebarExpanded,
  emptyMessage,
}: AgentMessagingClientListProps) {
  const { t } = useLocalization();

  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );

  const sortedAgentClients = useMemo(
    () =>
      sortAgentClients(clients, "recent", conversationMap, (client) =>
        agentClientActionFromConversation(client, conversationMap.get(client.id))
      ),
    [clients, conversationMap]
  );

  if (isLoadingClients) {
    return (
      <Box className="flex h-full items-center justify-center p-3">
        <Box className="text-center">
          <KeyTurnLoader message={t("agent.loading_clients")} />
        </Box>
      </Box>
    );
  }

  if (clients.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center p-3">
        <Box className="text-center">
          <Box className={SIDEBAR_INSET_EMPTY_ICON_WRAP}>
            <Icon name="message-circle" className={SIDEBAR_INSET_EMPTY_ICON} />
          </Box>
          <BodyText as="p" size="sm" className={`mb-4 ${SIDEBAR_INSET_BODY_MUTED}`}>
            {emptyMessage}
          </BodyText>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {sortedAgentClients.map((client) => {
        const conversation = conversationMap.get(client.id);
        const messagePreview = conversation?.last_message
          ? getMessagePreview({ content: conversation.last_message })
          : null;
        const handleClientClick = () => {
          onClientSelect?.(client.id);
          setIsSidebarExpanded(false);
        };
        const isSelected = selectedClientId === client.id;
        return (
          <Box
            key={client.id}
            role="button"
            tabIndex={0}
            {...sidebarInsetListRowSelectedProps(isSelected)}
            onClick={handleClientClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClientClick();
              }
            }}
            className={sidebarInsetListRowClass(isSelected)}
          >
            {isSelected ? <SidebarInsetListSelectionStripe /> : null}
            <AgentClientListRow
              embedded
              client={client}
              conversation={conversation}
              variant="sidebar"
              detailLine={messagePreview ?? client.email ?? undefined}
            />
          </Box>
        );
      })}
    </>
  );
}
