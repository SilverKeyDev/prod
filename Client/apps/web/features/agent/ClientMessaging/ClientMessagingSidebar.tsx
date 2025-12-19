import { MessageCircle } from "lucide-react";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";
import { ConnectionRequestsInbox } from "../modals";
import type { AgentConversation } from "../../../../../packages/config/api/agent";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
};

type ClientMessagingSidebarProps = {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  showInbox: boolean;
  setShowInbox: (show: boolean) => void;
  agentId?: string;
  activeConversation?: AgentConversation;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  localMessages: ChatMessage[];
};

export default function ClientMessagingSidebar({
  isSidebarExpanded,
  setIsSidebarExpanded,
  showInbox,
  setShowInbox,
  agentId,
  activeConversation,
  activeConversationId,
  setActiveConversationId,
  localMessages,
}: ClientMessagingSidebarProps) {
  return (
    <aside
      className={`${
        isSidebarExpanded
          ? "flex translate-x-0 z-10"
          : "hidden -translate-x-full"
      } flex-col transition-transform duration-300 ease-in-out xl:flex xl:w-80 xl:translate-x-0 xl:z-0 ${
        isSidebarExpanded ? "rounded-xl shadow-xl" : ""
      } xl:rounded-l-xl xl:shadow-none`}
    >
      {/* Fixed Header */}
      <UnifiedMessagingHeader
        mode={showInbox ? "connection-requests" : "inbox"}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onInboxClick={() => setShowInbox(true)}
        onBackClick={() => setShowInbox(false)}
        className={`${
          isSidebarExpanded ? "rounded-t-xl" : ""
        } xl:rounded-tl-xl xl:rounded-tr-none`}
      />

      {/* Scrollable Agent List */}
      <div
        className={`flex-1 overflow-y-auto bg-white border-r border-gray-200 ${
          isSidebarExpanded ? "rounded-b-xl" : ""
        } xl:rounded-bl-xl xl:rounded-br-none`}
      >
        {showInbox ? (
          <ConnectionRequestsInbox
            onRequestAccepted={() => {
              setShowInbox(false);
            }}
          />
        ) : !agentId ? (
          <div className="flex h-full items-center justify-center p-3">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-3 h-12 w-12 text-black/30" />
              <p className="mb-4 text-sm text-black/60">
                Search for an agent to start messaging
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              if (activeConversation) {
                setActiveConversationId(activeConversation.id);
              }
              setIsSidebarExpanded(false);
            }}
            className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${
              activeConversationId === activeConversation?.id
                ? "bg-beige/20"
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
        )}
      </div>
    </aside>
  );
}
