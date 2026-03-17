import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";
import { ConnectionRequestsInbox } from "@/features/agent/components/modals/ConnectionRequestsInbox";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";
import { getMessagePreview } from "@/features/messaging/utils";

import UnifiedMessagingHeader from "./UnifiedMessagingHeader";
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
  const { t } = useLocalization();
  return (
    <>
      {/* Backdrop for mobile - only show when sidebar is expanded on mobile */}
      {isSidebarExpanded && (
        <Box
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out xl:hidden"
          onClick={() => setIsSidebarExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarExpanded
            ? "fixed left-0 top-0 z-50 flex h-full w-80 translate-x-0 xl:relative xl:z-0"
            : "hidden -translate-x-full xl:flex xl:translate-x-0"
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${isSidebarExpanded ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none" : ""}`}
      >
        {/* Fixed Header */}
        <UnifiedMessagingHeader
          mode={showInbox ? "connection-requests" : "inbox"}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={() => setShowInbox(true)}
          onBackClick={() => setShowInbox(false)}
          className={`${isSidebarExpanded ? "rounded-t-xl" : ""} xl:rounded-tl-xl xl:rounded-tr-none`}
        />

        {/* Scrollable Agent List */}
        <Box
          className={`border-border bg-background-surface flex-1 overflow-y-auto border-r ${isSidebarExpanded ? "rounded-b-xl" : ""} xl:rounded-bl-xl xl:rounded-br-none`}
        >
          {showInbox ? (
            <ConnectionRequestsInbox
              onRequestAccepted={() => {
                setShowInbox(false);
              }}
            />
          ) : !agentId ? (
            <Box className="flex h-full items-center justify-center p-3">
              <Box className="text-center">
                <Icon name="message-circle" className="mx-auto mb-3 h-12 w-12 text-neutral-400" />
                <BodyText as="p" size="sm" className="mb-4 text-neutral-600">
                  {t("agent.search_agent_to_start_messaging")}
                </BodyText>
              </Box>
            </Box>
          ) : (
            <Box
              role="button"
              tabIndex={0}
              onClick={() => {
                if (activeConversation) {
                  setActiveConversationId(activeConversation.id);
                }
                setIsSidebarExpanded(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (activeConversation) {
                    setActiveConversationId(activeConversation.id);
                  }
                  setIsSidebarExpanded(false);
                }
              }}
              className={`border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${activeConversationId === activeConversation?.id ? "bg-olive/10 border-l-olive border-l-4" : ""}`}
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
          )}
        </Box>
      </aside>
    </>
  );
}
