import { useState } from "react";
import { useAgentClients } from "../../../../../packages/hooks/data/useAgentClients";
import ClientManagement from "./ClientManagement";
import AgentMessaging from "../AgentMessaging";
import type { AgentClient } from "../../../../../packages/config/api/agent";

export default function AgentDashboard() {
  const { clients, isLoading } = useAgentClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  return (
    <div className="mx-auto h-[calc(100vh-10rem)] max-w-7xl md:mt-0">
      <div className="relative flex h-full overflow-hidden rounded-xl shadow-lg">
        {/* Left Sidebar - Client List */}
        <ClientManagement
          clients={clients}
          isLoading={isLoading}
          selectedClientId={selectedClientId}
          onClientSelect={handleClientSelect}
        />

        {/* Right Side - Messaging */}
        <AgentMessaging
          selectedClientId={selectedClientId}
          selectedClient={clients.find((c) => c.id === selectedClientId)}
        />
      </div>
    </div>
  );
}
