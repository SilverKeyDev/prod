import React, { useMemo } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import {
  agentClientKindTranslationKey,
  type AgentClientSortMode,
  getMessagingConfig,
  type MessagingMode,
  pipelineStageTranslationKey,
  sortAgentClients,
} from "packages/features/agent";
import { getMessagePreview } from "packages/features/messaging";
import { Box } from "packages/ui/components/structure/primitives";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
} from "packages/ui/components/structure/sidebar/sidebarTheme";

import { BodyText, KeyTurnLoader, Title } from "@/components/ui";

import { MessagingSidebarAvatar } from "./unifiedMessagingSidebar/MessagingSidebarAvatar";
import { compareConversationsByRecency } from "./unifiedMessagingSidebar/unifiedMessagingSidebarModel";

type UnifiedMessagingSidebarClientListProps = {
  mode: MessagingMode;
  activeConversationId: string;
  setActiveConversationId?: (id: string) => void;
  setIsSidebarExpanded: (expanded: boolean) => void;
  clientConversations: AgentConversation[];
  isLoadingClientConversations: boolean;
  clients: AgentClient[];
  isLoadingClients: boolean;
  selectedClientId: string | null;
  onClientSelect?: (clientId: string) => void;
  conversations: AgentConversation[];
  agentClientSort: AgentClientSortMode;
};

export function UnifiedMessagingSidebarClientList({
  mode,
  activeConversationId,
  setActiveConversationId,
  setIsSidebarExpanded,
  clientConversations,
  isLoadingClientConversations,
  clients,
  isLoadingClients,
  selectedClientId,
  onClientSelect,
  conversations,
  agentClientSort,
}: UnifiedMessagingSidebarClientListProps) {
  const { t } = useLocalization();
  const config = getMessagingConfig(mode);

  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );

  const sortedAgentClients = useMemo(
    () => sortAgentClients(clients, agentClientSort, conversationMap),
    [clients, agentClientSort, conversationMap]
  );

  const sortedClientConversations = useMemo(
    () => [...clientConversations].sort(compareConversationsByRecency),
    [clientConversations]
  );

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
                <MessagingSidebarAvatar name={displayName} imageUrl={conv.agent_profile_picture} />
                <Box className="min-w-0 flex-1">
                  <Title as="h3" size="sm" className="text-text-primary mb-1 truncate font-medium">
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
                <BodyText as="p" className="text-text-primary mb-0.5 truncate text-xs font-medium">
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
                {client.phone && !messagePreview ? (
                  <BodyText as="p" className="text-text-secondary truncate text-xs">
                    {client.phone}
                  </BodyText>
                ) : null}
              </Box>
            </Box>
          </Box>
        );
      })}
    </>
  );
}
