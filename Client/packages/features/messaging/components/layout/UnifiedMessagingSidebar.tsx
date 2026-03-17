import { Icon } from "@ui/icons";

import type { AgentClient, AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { getMessagePreview } from "packages/features/messaging/utils";
import { Box } from "packages/ui/components/primitives";

import { BodyText, KeyTurnLoader, Title } from "@/components/ui";
import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messagingConfig";
import { ConnectionRequestsInbox } from "@/features/agent/components/modals/ConnectionRequestsInbox";
type UnifiedMessagingSidebarProps = {
  mode: MessagingMode;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  showInbox: boolean;
  setShowInbox: (show: boolean) => void;
  // Client mode props
  agentId?: string;
  activeConversation?: AgentConversation;
  activeConversationId: string;
  setActiveConversationId?: (id: string) => void;
  localMessages?: ChatMessage[];
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
  // Client mode
  agentId,
  activeConversation,
  activeConversationId,
  setActiveConversationId,
  localMessages = [],
  // Agent mode
  clients = [],
  isLoadingClients = false,
  selectedClientId = null,
  onClientSelect,
  conversations = [],
  onSearchClick,
}: UnifiedMessagingSidebarProps) {
  const { t } = useLocalization();
  const config = getMessagingConfig(mode);
  // Create a map of client_id -> conversation for quick lookup (agent mode)
  const conversationMap = new Map(conversations.map((conv) => [conv.client_id, conv]));
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
      if (!agentId) {
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
      const handleYourAgentClick = () => {
        if (activeConversation && setActiveConversationId) {
          setActiveConversationId(activeConversation.id);
        }
        setIsSidebarExpanded(false);
      };
      return (
        <Box
          role="button"
          tabIndex={0}
          onClick={handleYourAgentClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleYourAgentClick();
            }
          }}
          className={`border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${
            activeConversationId === activeConversation?.id
              ? "border-l-olive bg-olive/10 border-l-4"
              : ""
          }`}
        >
          <Box className="flex items-start justify-between">
            <Box className="min-w-0 flex-1">
              <Title as="h3" size="sm" className="mb-1 truncate font-medium text-neutral-800">
                {t("agent.your_agent")}
              </Title>
              {localMessages.length > 0 && (
                <BodyText as="p" className="truncate text-xs text-neutral-600">
                  {getMessagePreview(
                    localMessages[localMessages.length - 1] ?? {
                      content: "",
                    }
                  )}
                </BodyText>
              )}
            </Box>
          </Box>
        </Box>
      );
    } else {
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
                className={`border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${selectedClientId === client.id ? "border-l-olive bg-olive/10 border-l-4" : ""}`}
              >
                <Box className="flex items-start gap-3">
                  <Box className="min-w-0 flex-1">
                    <Title as="h3" size="sm" className="mb-1 truncate font-medium text-neutral-800">
                      {client.name}
                    </Title>
                    {conversation?.last_message ? (
                      <BodyText as="p" className="truncate text-xs text-neutral-600">
                        {conversation.last_message}
                      </BodyText>
                    ) : (
                      <BodyText as="p" className="truncate text-xs text-neutral-600">
                        {client.email}
                      </BodyText>
                    )}
                    {client.phone && !conversation?.last_message && (
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
    }
  };
  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (mode === "client") return "inbox";
    return "clients";
  };
  return (
    <>
      {/* Backdrop for mobile - only show when sidebar is expanded on mobile, positioned relative to messaging container */}
      {isSidebarExpanded && (
        <Box
          className="bg-overlay-backdrop absolute inset-0 z-40 transition-opacity duration-300 ease-in-out xl:hidden"
          onClick={() => setIsSidebarExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarExpanded
            ? "absolute bottom-0 left-0 top-0 z-50 flex h-full w-80 translate-x-0 xl:relative xl:z-0"
            : "hidden -translate-x-full xl:flex xl:translate-x-0"
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${isSidebarExpanded ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none" : ""}`}
      >
        {/* Fixed Header */}
        <UnifiedMessagingHeader
          mode={getHeaderMode()}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={mode === "client" ? () => setShowInbox(true) : undefined}
          onBackClick={() => setShowInbox(false)}
          onSearchClick={onSearchClick}
          className={`${isSidebarExpanded ? "rounded-t-xl" : ""} xl:rounded-tl-xl xl:rounded-tr-none`}
        />

        {/* Scrollable Content */}
        <Box
          className={`border-border bg-background-surface flex-1 overflow-y-auto border-r ${isSidebarExpanded ? "rounded-b-xl" : ""} xl:rounded-bl-xl xl:rounded-br-none`}
        >
          {renderSidebarContent()}
        </Box>
      </aside>
    </>
  );
}
