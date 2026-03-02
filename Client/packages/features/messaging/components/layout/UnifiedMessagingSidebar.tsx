import { MessageCircle } from "lucide-react";

import type { AgentClient, AgentConversation } from "packages/api";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { getMessagePreview } from "packages/features/messaging/utils";
import { BodyText, KeyTurnLoader, Title } from "packages/ui/components/index.web";

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
          <div className="flex h-full items-center justify-center p-3">
            <div className="text-center">
              <div className="bg-beige/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <MessageCircle className="h-6 w-6 text-black/40" />
              </div>
              <BodyText as="p" size="sm" className="mb-4 text-black/60">
                {config.sidebar.emptyMessage}
              </BodyText>
            </div>
          </div>
        );
      }

      const handleYourAgentClick = () => {
        if (activeConversation && setActiveConversationId) {
          setActiveConversationId(activeConversation.id);
        }
        setIsSidebarExpanded(false);
      };
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={handleYourAgentClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleYourAgentClick();
            }
          }}
          className={`border-beige/50 hover:bg-beige/10 group cursor-pointer border-b p-3 transition-colors ${
            activeConversationId === activeConversation?.id
              ? "bg-beige/30 border-l-beige border-l-4"
              : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Title as="h3" size="sm" className="mb-1 truncate font-medium text-black">
                Your Agent
              </Title>
              {localMessages.length > 0 && (
                <BodyText as="p" className="truncate text-xs text-black/50">
                  {getMessagePreview(
                    localMessages[localMessages.length - 1] ?? {
                      content: "",
                    }
                  )}
                </BodyText>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Agent mode
      if (isLoadingClients) {
        return (
          <div className="flex h-full items-center justify-center p-3">
            <div className="text-center">
              <KeyTurnLoader message="Loading clients..." />
            </div>
          </div>
        );
      }

      if (clients.length === 0) {
        return (
          <div className="flex h-full items-center justify-center p-3">
            <div className="text-center">
              <div className="bg-beige/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <MessageCircle className="h-6 w-6 text-black/40" />
              </div>
              <BodyText as="p" size="sm" className="mb-4 text-black/60">
                {config.sidebar.emptyMessage}
              </BodyText>
            </div>
          </div>
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
              <div
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
                className={`border-beige/50 hover:bg-beige/10 group cursor-pointer border-b p-3 transition-colors ${
                  selectedClientId === client.id ? "bg-beige/30 border-l-beige border-l-4" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Title as="h3" size="sm" className="mb-1 truncate font-medium text-black">
                      {client.name}
                    </Title>
                    {conversation?.last_message ? (
                      <BodyText as="p" className="truncate text-xs text-black/50">
                        {conversation.last_message}
                      </BodyText>
                    ) : (
                      <BodyText as="p" className="truncate text-xs text-black/50">
                        {client.email}
                      </BodyText>
                    )}
                    {client.phone && !conversation?.last_message && (
                      <BodyText as="p" className="truncate text-xs text-black/40">
                        {client.phone}
                      </BodyText>
                    )}
                  </div>
                </div>
              </div>
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
        <div
          className="absolute inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out xl:hidden"
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
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${
          isSidebarExpanded ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none" : ""
        }`}
      >
        {/* Fixed Header */}
        <UnifiedMessagingHeader
          mode={getHeaderMode()}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={mode === "client" ? () => setShowInbox(true) : undefined}
          onBackClick={() => setShowInbox(false)}
          onSearchClick={onSearchClick}
          className={`${
            isSidebarExpanded ? "rounded-t-xl" : ""
          } xl:rounded-tl-xl xl:rounded-tr-none`}
        />

        {/* Scrollable Content */}
        <div
          className={`flex-1 overflow-y-auto border-r border-neutral-200 bg-white ${
            isSidebarExpanded ? "rounded-b-xl" : ""
          } xl:rounded-bl-xl xl:rounded-br-none`}
        >
          {renderSidebarContent()}
        </div>
      </aside>
    </>
  );
}
