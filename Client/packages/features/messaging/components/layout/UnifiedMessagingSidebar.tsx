import React, { useMemo } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import { getMessagePreview } from "packages/features/messaging/utils/messagePreview";
import { ProfileAvatar } from "packages/ui/components";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, KeyTurnLoader, Title } from "@/components/ui";
import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messaging/screen/messagingConfig";
import { ConnectionRequestsInbox } from "@/features/agent/components/modals/inbox/ConnectionRequestsInbox";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";

function MessagingSidebarAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  return (
    <Box className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
      <ProfileAvatar imageUrl={imageUrl} label={name} imageClassName="h-full w-full object-cover" />
    </Box>
  );
}

function compareConversationsByRecency(a: AgentConversation, b: AgentConversation): number {
  const taRaw = a.last_message_at ?? a.updated_at;
  const tbRaw = b.last_message_at ?? b.updated_at;
  if (!taRaw && !tbRaw) return 0;
  if (!taRaw) return 1;
  if (!tbRaw) return -1;
  return dateParseISO(tbRaw).valueOf() - dateParseISO(taRaw).valueOf();
}

type UnifiedMessagingSidebarProps = {
  mode: MessagingMode;
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
  const conversationMap = new Map(conversations.map((conv) => [conv.client_id, conv]));

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
              <Box className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Icon name="message-circle" className="h-6 w-6 text-neutral-400" />
              </Box>
              <BodyText as="p" size="sm" className="mb-4 text-neutral-600">
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
                className={`border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${
                  activeConversationId === conv.id ? "border-l-olive bg-olive/10 border-l-4" : ""
                }`}
              >
                <Box className="flex items-center gap-3">
                  <MessagingSidebarAvatar
                    name={displayName}
                    imageUrl={conv.agent_profile_picture}
                  />
                  <Box className="min-w-0 flex-1">
                    <Title as="h3" size="sm" className="mb-1 truncate font-medium text-neutral-800">
                      {displayName}
                    </Title>
                    {messagePreview ? (
                      <BodyText as="p" className="truncate text-xs text-neutral-600">
                        {messagePreview}
                      </BodyText>
                    ) : conv.agent_email ? (
                      <BodyText as="p" className="truncate text-xs text-neutral-600">
                        {conv.agent_email}
                      </BodyText>
                    ) : (
                      <BodyText as="p" className="truncate text-xs text-neutral-600">
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
            <Box className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Icon name="message-circle" className="h-6 w-6 text-neutral-400" />
            </Box>
            <BodyText as="p" size="sm" className="mb-4 text-neutral-600">
              {config.sidebar.emptyMessage}
            </BodyText>
          </Box>
        </Box>
      );
    }
    return (
      <>
        {clients.map((client) => {
          const conversation = conversationMap.get(client.id);
          const messagePreview = conversation?.last_message
            ? getMessagePreview({ content: conversation.last_message })
            : null;
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
              className={`border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${
                selectedClientId === client.id ? "border-l-olive bg-olive/10 border-l-4" : ""
              }`}
            >
              <Box className="flex items-center gap-3">
                <MessagingSidebarAvatar
                  name={client.name}
                  imageUrl={client.profile_picture ?? conversation?.client_profile_picture}
                />
                <Box className="min-w-0 flex-1">
                  <Title as="h3" size="sm" className="mb-1 truncate font-medium text-neutral-800">
                    {client.name}
                  </Title>
                  {messagePreview ? (
                    <BodyText as="p" className="truncate text-xs text-neutral-600">
                      {messagePreview}
                    </BodyText>
                  ) : (
                    <BodyText as="p" className="truncate text-xs text-neutral-600">
                      {t("agent.role_buyer")}
                    </BodyText>
                  )}
                  {client.phone && !messagePreview && (
                    <BodyText as="p" className="truncate text-xs text-neutral-500">
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
      {isSidebarExpanded && (
        <Box
          className="bg-overlay-backdrop absolute inset-0 z-40 transition-opacity duration-300 ease-in-out xl:hidden"
          onClick={() => setIsSidebarExpanded(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${
          isSidebarExpanded
            ? "z-sidebar absolute bottom-0 left-0 top-0 flex h-full w-80 translate-x-0 xl:relative xl:z-0"
            : "hidden -translate-x-full xl:flex xl:translate-x-0"
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${
          isSidebarExpanded ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none" : ""
        }`}
      >
        <UnifiedMessagingHeader
          mode={getHeaderMode()}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={() => setShowInbox(true)}
          onBackClick={() => setShowInbox(false)}
          onSearchClick={onSearchClick}
          pendingConnectionRequestCount={pendingConnectionRequestCount}
          className={`${
            isSidebarExpanded ? "rounded-t-xl" : ""
          } xl:rounded-tl-xl xl:rounded-tr-none`}
        />

        <Box
          className={`border-border bg-background-surface flex-1 overflow-y-auto border-r ${
            isSidebarExpanded ? "rounded-b-xl" : ""
          } xl:rounded-bl-xl xl:rounded-br-none`}
        >
          {renderSidebarContent()}
        </Box>
      </aside>
    </>
  );
}
