import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";
import type { ReactNode } from "react";

import { useAgentClients } from "packages/hooks/data/agent/useAgentClients";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { dateParseISO } from "packages/utils/core/date";

import AgentMessaging from "@/features/agent/AgentMessaging";

type AgentDashboardProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
};

type ClientLike = { id: string };
type ConversationLike = { client_id: string; last_message_at?: string | null };

function useAgentAutoSelectClient(
  clients: ClientLike[],
  conversations: ConversationLike[],
  isLoading: boolean,
): [string | null, (clientId: string) => void] {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    localStorage.setItem("agent_last_selected_client", clientId);
  };

  useEffect(() => {
    if (
      hasAutoSelected ||
      isLoading ||
      conversations.length === 0 ||
      !clients.length ||
      selectedClientId
    ) {
      return;
    }
    const findLastConversation = async () => {
      try {
        const lastSelectedClientId = localStorage.getItem(
          "agent_last_selected_client",
        );
        if (
          lastSelectedClientId &&
          clients.some((c) => c.id === lastSelectedClientId)
        ) {
          const lastConversation = conversations.find(
            (c) => c.client_id === lastSelectedClientId,
          );
          if (lastConversation && lastConversation.last_message_at) {
            setSelectedClientId(lastSelectedClientId);
            setHasAutoSelected(true);
            return;
          }
        }
        const sortedConversations = [...conversations]
          .filter((c) => c.last_message_at)
          .sort((a, b) => {
            const aTime = dateParseISO(a.last_message_at!).valueOf();
            const bTime = dateParseISO(b.last_message_at!).valueOf();
            return bTime - aTime;
          });
        if (sortedConversations.length > 0) {
          const mostRecent = sortedConversations[0];
          setSelectedClientId(mostRecent.client_id);
          localStorage.setItem(
            "agent_last_selected_client",
            mostRecent.client_id,
          );
        } else if (conversations.length > 0) {
          setSelectedClientId(conversations[0].client_id);
          localStorage.setItem(
            "agent_last_selected_client",
            conversations[0].client_id,
          );
        }
        setHasAutoSelected(true);
      } catch (error) {
        log.warn(LOG_CATEGORIES.DASHBOARD, "Error in auto-selection", error);
        if (conversations.length > 0) {
          setSelectedClientId(conversations[0].client_id);
        }
        setHasAutoSelected(true);
      }
    };
    void findLastConversation();
  }, [conversations, clients, isLoading, hasAutoSelected, selectedClientId]);

  return [selectedClientId, handleClientSelect];
}

export default function AgentDashboard({
  setMobileHeaderActions,
}: AgentDashboardProps = {}) {
  const { clients, isLoading } = useAgentClients();
  const { conversations } = useAgentChats();
  const [selectedClientId, handleClientSelect] = useAgentAutoSelectClient(
    clients,
    conversations,
    isLoading,
  );

  return (
    <AgentMessaging
      clients={clients}
      isLoadingClients={isLoading}
      selectedClientId={selectedClientId}
      selectedClient={clients.find((c) => c.id === selectedClientId)}
      onClientSelect={handleClientSelect}
      setMobileHeaderActions={setMobileHeaderActions}
    />
  );
}
