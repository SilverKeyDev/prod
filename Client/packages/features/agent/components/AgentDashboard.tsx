import { useMemo } from "react";

import type { ReactNode } from "react";

import type { AgentClient } from "packages/api";
import { useAgentChats } from "packages/features/messaging";

import AgentMessaging from "@/features/agent/components/AgentMessaging";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";

type AgentDashboardProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
};

export default function AgentDashboard({
  setMobileHeaderActions,
}: AgentDashboardProps = {}) {
  const { clients, isLoading } = useAgentClients();
  const { conversations } = useAgentChats();

  // Merge clients from useAgentClients with any clients only known from conversations.
  // This handles the window where AgentConnections exist but client_ids hasn't synced yet.
  const mergedClients = useMemo(() => {
    const knownIds = new Set(clients.map((c) => c.id));
    const extras: AgentClient[] = [];

    for (const conv of conversations) {
      if (!knownIds.has(conv.client_id)) {
        knownIds.add(conv.client_id);
        extras.push({
          id: conv.client_id,
          name: conv.client_name ?? "Client",
          email: conv.client_email ?? "",
          phone: null,
          profile_picture: conv.client_profile_picture ?? null,
          created_at: conv.created_at ?? null,
        });
      }
    }

    return extras.length > 0 ? [...clients, ...extras] : clients;
  }, [clients, conversations]);

  const [selectedClientId, handleClientSelect] = useAgentAutoSelectClient(
    mergedClients,
    conversations,
    isLoading,
  );

  return (
    <AgentMessaging
      clients={mergedClients}
      isLoadingClients={isLoading}
      selectedClientId={selectedClientId}
      selectedClient={mergedClients.find((c) => c.id === selectedClientId)}
      onClientSelect={handleClientSelect}
      setMobileHeaderActions={setMobileHeaderActions}
    />
  );
}
