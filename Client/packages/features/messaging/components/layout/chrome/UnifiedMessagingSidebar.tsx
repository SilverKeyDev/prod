import React, { useState } from "react";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import type { AgentClientSortMode } from "packages/features/agent";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import { Box } from "packages/ui/components/structure/primitives";

import { Button } from "@/components/ui";
import { type MessagingMode } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useConnectionRequests } from "@/features/agent/hooks/data/connections/useConnectionRequests";

import { UnifiedMessagingSidebarClientList } from "./UnifiedMessagingSidebarClientList";
import { UnifiedMessagingSidebarInbox } from "./UnifiedMessagingSidebarInbox";

type UnifiedMessagingSidebarProps = {
  mode: MessagingMode;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  showInbox: boolean;
  setShowInbox: (show: boolean) => void;
  activeConversationId: string;
  setActiveConversationId?: (id: string) => void;
  clientConversations?: AgentConversation[];
  isLoadingClientConversations?: boolean;
  clients?: AgentClient[];
  isLoadingClients?: boolean;
  selectedClientId?: string | null;
  onClientSelect?: (clientId: string) => void;
  conversations?: AgentConversation[];
  onSearchClick?: () => void;
};

export default function UnifiedMessagingSidebar({
  mode,
  isSidebarExpanded,
  setIsSidebarExpanded,
  showInbox,
  setShowInbox,
  activeConversationId,
  setActiveConversationId,
  clientConversations = [],
  isLoadingClientConversations = false,
  clients = [],
  isLoadingClients = false,
  selectedClientId = null,
  onClientSelect,
  conversations = [],
  onSearchClick,
}: UnifiedMessagingSidebarProps) {
  const { t } = useLocalization();
  const { requests: pendingConnectionRequests } = useConnectionRequests();
  const pendingConnectionRequestCount = pendingConnectionRequests.length;
  const [agentClientSort, setAgentClientSort] = useState<AgentClientSortMode>("recent");

  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (mode === "client") return "agents";
    return "clients";
  };

  return (
    <aside
      className={`${
        isSidebarExpanded
          ? "z-sidebar absolute inset-0 flex xl:relative xl:inset-auto xl:z-0 xl:w-80"
          : "hidden xl:flex xl:w-80"
      } flex-col transition-transform duration-300 ease-in-out xl:rounded-l-xl`}
    >
      <UnifiedMessagingHeader
        mode={getHeaderMode()}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onInboxClick={() => setShowInbox(true)}
        onBackClick={() => setShowInbox(false)}
        onSearchClick={onSearchClick}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
        className="xl:rounded-tl-xl xl:rounded-tr-none"
      />

      {mode === "agent" && !showInbox && !isLoadingClients && clients.length > 0 ? (
        <Box className="border-border bg-background-surface flex-shrink-0 border-b border-r px-2 py-2">
          <Box className="flex gap-1">
            {(
              [
                ["recent", "agent.sort_clients_recent"],
                ["name", "agent.sort_clients_name"],
                ["stage", "agent.sort_clients_stage"],
              ] as const
            ).map(([value, labelKey]) => (
              <Button
                key={value}
                type="button"
                variant={agentClientSort === value ? "secondary" : "ghost"}
                className="flex-1 px-2 py-1.5 text-xs"
                label={t(labelKey)}
                onClick={() => setAgentClientSort(value)}
              >
                {t(labelKey)}
              </Button>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box className="border-border bg-background-surface flex-1 overflow-y-auto border-r xl:rounded-bl-xl xl:rounded-br-none">
        {showInbox ? (
          <UnifiedMessagingSidebarInbox
            onRequestAccepted={() => {
              setShowInbox(false);
            }}
          />
        ) : (
          <UnifiedMessagingSidebarClientList
            mode={mode}
            activeConversationId={activeConversationId}
            setActiveConversationId={setActiveConversationId}
            setIsSidebarExpanded={setIsSidebarExpanded}
            clientConversations={clientConversations}
            isLoadingClientConversations={isLoadingClientConversations}
            clients={clients}
            isLoadingClients={isLoadingClients}
            selectedClientId={selectedClientId}
            onClientSelect={onClientSelect}
            conversations={conversations}
            agentClientSort={agentClientSort}
          />
        )}
      </Box>
    </aside>
  );
}
