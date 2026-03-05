import type { ReactNode } from "react";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";

import AgentMessaging from "@/features/agent/components/AgentMessaging";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";

type AgentDashboardProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function AgentDashboard({ setMobileHeaderActions }: AgentDashboardProps = {}) {
  const { clients, isLoading } = useAgentClients();
  const { conversations } = useAgentChats();
  const [selectedClientId, handleClientSelect] = useAgentAutoSelectClient(
    clients,
    conversations,
    isLoading
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
