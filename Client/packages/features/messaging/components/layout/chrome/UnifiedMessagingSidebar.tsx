import React, { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import { getMessagePreview } from "packages/features/messaging/utils/messagePreview";
import { Box } from "packages/ui/components/primitives";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
} from "packages/ui/components/sidebar/sidebarTheme";

import { BodyText, Button, KeyTurnLoader, Title } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { ConnectionRequestsInbox } from "@/features/agent/components/modals/inbox/ConnectionRequestsInbox";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import {
  agentClientKindTranslationKey,
  pipelineStageTranslationKey,
} from "@/features/agent/utils/agentClientListLabels";
import {
  type AgentClientSortMode,
  sortAgentClients,
} from "@/features/agent/utils/agentClientListSort";

import { MessagingSidebarAvatar } from "./unifiedMessagingSidebar/MessagingSidebarAvatar";
import { compareConversationsByRecency } from "./unifiedMessagingSidebar/unifiedMessagingSidebarModel";

type UnifiedMessagingSidebarProps = {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  showInbox: boolean;
  setShowInbox: (show: boolean) => void;
  activeConversationId: string;
  setActiveConversationId?: (id: string) => void;
  // Client mode - list of conversations for the signed-in buyer (same pattern as agent client list)
  clientConversations?: AgentConversation[];
  isLoadingClientConversations?: boolean;
  // Agent mode props
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
  const config = getMessagingConfig(mode);
  const { requests: pendingConnectionRequests } = useConnectionRequests();
  const pendingConnectionRequestCount = pendingConnectionRequests.length;
  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );
  const [agentClientSort, setAgentClientSort] = useState<AgentClientSortMode>("recent");
  const sortedAgentClients = useMemo(
    () => sortAgentClients(clients, agentClientSort, conversationMap),
    [clients, agentClientSort, conversationMap]
  );

  const sortedClientConversations = useMemo(
    () => [...clientConversations].sort(compareConversationsByRecency),
    [clientConversations]
  );

  const renderSidebarContent = () => {
    if (showInbox) {
      return (
        <ConnectionRequestsInbox
          onRequestAccepted={() => {
            setShowInbox(false);
          }}
        />
      );
    }
    if (mode === "client") {
      if (isLoadingClientConversations && sortedClientConversations.length === 0) {
        return (
          <Box className="flex h-full items-center justify-center p-3">
            <Box className="text-center">
              <KeyTurnLoader message={t("agent.loading_conversations")} />
            </Box>
          </Box>
        );
      }
      if (sortedClientConversations.length === 0) {
        return (
          <Box className="flex h-full items-center justify-center p-3">
            <Box className="text-center">
              <Box className={SIDEBAR_INSET_EMPTY_ICON_WRAP}>
                <Icon name="message-circle" className={SIDEBAR_INSET_EMPTY_ICON} />
              </Box>
              <BodyText as="p" size="sm" className={`mb-4 ${SIDEBAR_INSET_BODY_MUTED}`}>
                {config.sidebar.emptyMessage}
              </BodyText>
            </Box>
          </Box>
        );
      }
      return (
        <>
          {sortedClientConversations.map((conv) => {
            const displayName = conv.agent_name ?? t("agent.role_agent");
            const messagePreview = conv.last_message
              ? getMessagePreview({ content: conv.last_message })
              : null;
            const handleConversationClick = () => {
              if (setActiveConversationId) {
                setActiveConversationId(conv.id);
              }
              setIsSidebarExpanded(false);
            };
            return (
              <Box
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={handleConversationClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleConversationClick();
                  }
                }}
                className={sidebarInsetListRowClass(activeConversationId === conv.id)}
              >
                <Box className="flex items-center gap-3">
                  <MessagingSidebarAvatar
                    name={displayName}
                    imageUrl={conv.agent_profile_picture}
                  />
                  <Box className="min-w-0 flex-1">
                    <Title
                      as="h3"
                      size="sm"
                      className="text-text-primary mb-1 truncate font-medium"
                    >
                      {displayName}
                    </Title>
                    {messagePreview ? (
                      <BodyText as="p" className="text-text-secondary truncate text-xs">
                        {messagePreview}
                      </BodyText>
                    ) : conv.agent_email ? (
                      <BodyText as="p" className="text-text-secondary truncate text-xs">
                        {conv.agent_email}
                      </BodyText>
                    ) : (
                      <BodyText as="p" className="text-text-secondary truncate text-xs">
                        {t("agent.role_agent")}
                      </BodyText>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </>
      );
    }
    // Agent mode
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
              {config.sidebar.emptyMessage}
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
          const kindLabel = t(agentClientKindTranslationKey(client.client_kind));
          const stageLabel = t(pipelineStageTranslationKey(client.pipeline_stage));
          const typeStageLine = `${kindLabel} · ${stageLabel}`;
          const handleClientClick = () => {
            if (onClientSelect) {
              onClientSelect(client.id);
            }
            setIsSidebarExpanded(false);
          };
          return (
            <Box
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={handleClientClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClientClick();
                }
              }}
              className={sidebarInsetListRowClass(selectedClientId === client.id)}
            >
              <Box className="flex items-center gap-3">
                <MessagingSidebarAvatar
                  name={client.name}
                  imageUrl={client.profile_picture ?? conversation?.client_profile_picture}
                />
                <Box className="min-w-0 flex-1">
                  <Title as="h3" size="sm" className="text-text-primary mb-1 truncate font-medium">
                    {client.name}
                  </Title>
                  <BodyText
                    as="p"
                    className="text-text-primary mb-0.5 truncate text-xs font-medium"
                  >
                    {typeStageLine}
                  </BodyText>
                  {messagePreview ? (
                    <BodyText as="p" className="text-text-secondary truncate text-xs">
                      {messagePreview}
                    </BodyText>
                  ) : (
                    <BodyText as="p" className="text-text-secondary truncate text-xs">
                      {client.email}
                    </BodyText>
                  )}
                  {client.phone && !messagePreview && (
                    <BodyText as="p" className="text-text-secondary truncate text-xs">
                      {client.phone}
                    </BodyText>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </>
    );
  };
  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (mode === "client") return "agents";
    return "clients";
  };
  return (
    <>
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
          {renderSidebarContent()}
        </Box>
      </aside>
    </>
  );
}
