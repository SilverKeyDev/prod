import { MessageCircle } from "lucide-react";
import { KeyTurnLoader } from "../../../components/ui";
import UnifiedMessagingHeader from "../ClientMessaging/UnifiedMessagingHeader";
import { ConnectionRequestsInbox } from "../modals";
import type {
  AgentConversation,
  AgentClient,
} from "../../../../../packages/config/api";
import {
  getMessagingConfig,
  type MessagingMode,
} from "../config/messagingConfig";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
};

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
  const conversationMap = new Map(
    conversations.map((conv) => [conv.client_id, conv]),
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
      if (!agentId) {
        return (
          <div className="flex h-full items-center justify-center p-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-beige/30">
                <MessageCircle className="h-6 w-6 text-black/40" />
              </div>
              <p className="mb-4 text-sm text-black/60">
                {config.sidebar.emptyMessage}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div
          onClick={() => {
            if (activeConversation && setActiveConversationId) {
              setActiveConversationId(activeConversation.id);
            }
            setIsSidebarExpanded(false);
          }}
          className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${
            activeConversationId === activeConversation?.id
              ? "bg-beige/30 border-l-4 border-l-beige"
              : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate text-sm font-medium text-black">
                Your Agent
              </h3>
              {localMessages.length > 0 && (
                <p className="truncate text-xs text-black/50">
                  {localMessages[localMessages.length - 1]?.content ?? ""}
                </p>
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-beige/30">
                <MessageCircle className="h-6 w-6 text-black/40" />
              </div>
              <p className="mb-4 text-sm text-black/60">
                {config.sidebar.emptyMessage}
              </p>
            </div>
          </div>
        );
      }

      return (
        <>
          {clients.map((client) => {
            const conversation = conversationMap.get(client.id);
            return (
              <div
                key={client.id}
                onClick={() => {
                  if (onClientSelect) {
                    onClientSelect(client.id);
                  }
                  setIsSidebarExpanded(false);
                }}
                className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${
                  selectedClientId === client.id
                    ? "bg-beige/30 border-l-4 border-l-beige"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 truncate text-sm font-medium text-black">
                      {client.name}
                    </h3>
                    {conversation?.last_message ? (
                      <p className="truncate text-xs text-black/50">
                        {conversation.last_message}
                      </p>
                    ) : (
                      <p className="truncate text-xs text-black/50">
                        {client.email}
                      </p>
                    )}
                    {client.phone && !conversation?.last_message && (
                      <p className="truncate text-xs text-black/40">
                        {client.phone}
                      </p>
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
            ? "absolute left-0 top-0 bottom-0 flex h-full w-80 translate-x-0 z-50 xl:relative xl:z-0"
            : "hidden -translate-x-full xl:flex xl:translate-x-0"
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${
          isSidebarExpanded
            ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none"
            : ""
        }`}
      >
        {/* Fixed Header */}
        <UnifiedMessagingHeader
          mode={getHeaderMode()}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={
            mode === "client" ? () => setShowInbox(true) : undefined
          }
          onBackClick={() => setShowInbox(false)}
          onSearchClick={onSearchClick}
          className={`${
            isSidebarExpanded ? "rounded-t-xl" : ""
          } xl:rounded-tl-xl xl:rounded-tr-none`}
        />

        {/* Scrollable Content */}
        <div
          className={`flex-1 overflow-y-auto bg-white border-r border-neutral-200 ${
            isSidebarExpanded ? "rounded-b-xl" : ""
          } xl:rounded-bl-xl xl:rounded-br-none`}
        >
          {renderSidebarContent()}
        </div>
      </aside>
    </>
  );
}
