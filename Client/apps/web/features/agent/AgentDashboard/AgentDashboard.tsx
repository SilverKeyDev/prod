import { useState, useEffect } from "react";
import { useAgentClients } from "../../../../../packages/hooks/data/agent/useAgentClients";
import { useAgentChats } from "../../../../../packages/hooks/data/chat/useAgentChats";
import AgentMessaging from "../AgentMessaging";
import { log, LOG_CATEGORIES } from "../../../../../logger";

export default function AgentDashboard() {
  const { clients, isLoading } = useAgentClients();
  const { conversations } = useAgentChats();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    // Store in localStorage for next time
    localStorage.setItem("agent_last_selected_client", clientId);
  };

  // Auto-select the conversation where the agent last sent a message
  useEffect(() => {
    if (hasAutoSelected || isLoading || conversations.length === 0 || !clients.length || selectedClientId) {
      return;
    }

    const findLastConversation = async () => {
      try {
        // First, try to restore from localStorage
        const lastSelectedClientId = localStorage.getItem("agent_last_selected_client");
        if (lastSelectedClientId && clients.some((c) => c.id === lastSelectedClientId)) {
          const lastConversation = conversations.find((c) => c.client_id === lastSelectedClientId);
          if (lastConversation && lastConversation.last_message_at) {
            // If conversation exists and has messages, use it
            setSelectedClientId(lastSelectedClientId);
            setHasAutoSelected(true);
            return;
          }
        }

        // Find conversation with most recent message
        // Sort conversations by last_message_at descending
        const sortedConversations = [...conversations]
          .filter((c) => c.last_message_at) // Only consider conversations with messages
          .sort((a, b) => {
            const aTime = new Date(a.last_message_at!).getTime();
            const bTime = new Date(b.last_message_at!).getTime();
            return bTime - aTime;
          });

        // Select the most recent conversation
        if (sortedConversations.length > 0) {
          const mostRecent = sortedConversations[0];
          setSelectedClientId(mostRecent.client_id);
          localStorage.setItem("agent_last_selected_client", mostRecent.client_id);
        } else if (conversations.length > 0) {
          // Fallback: select first conversation if none have messages yet
          setSelectedClientId(conversations[0].client_id);
          localStorage.setItem("agent_last_selected_client", conversations[0].client_id);
        }

        setHasAutoSelected(true);
      } catch (error) {
        // If anything fails, just select the first available conversation
        log.warn(LOG_CATEGORIES.DASHBOARD, "Error in auto-selection", error);
        if (conversations.length > 0) {
          setSelectedClientId(conversations[0].client_id);
        }
        setHasAutoSelected(true);
      }
    };

    void findLastConversation();
  }, [conversations, clients, isLoading, hasAutoSelected, selectedClientId]);

  return (
    <AgentMessaging
      clients={clients}
      isLoadingClients={isLoading}
      selectedClientId={selectedClientId}
      selectedClient={clients.find((c) => c.id === selectedClientId)}
      onClientSelect={handleClientSelect}
    />
  );
}
