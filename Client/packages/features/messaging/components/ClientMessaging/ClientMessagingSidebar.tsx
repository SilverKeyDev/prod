import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
} from "packages/ui/components/sidebar/sidebarTheme";

import { BodyText, Title } from "@/components/ui";
import { ConnectionRequestsInbox } from "@/features/agent/components/modals/inbox/ConnectionRequestsInbox";
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
          className="bg-overlay-backdrop fixed inset-0 z-40 transition-opacity duration-300 ease-in-out xl:hidden"
          onClick={() => setIsSidebarExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarExpanded
            ? "z-sidebar fixed left-0 top-0 flex h-full w-80 translate-x-0 xl:relative xl:z-0"
            : "hidden -translate-x-full xl:flex xl:translate-x-0"
        } flex-col transition-transform duration-300 ease-in-out xl:w-80 ${
          isSidebarExpanded ? "rounded-xl shadow-xl xl:rounded-l-xl xl:shadow-none" : ""
        }`}
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
        <Box
          className={`border-border bg-background-surface flex-1 overflow-y-auto border-r ${
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
            <Box className="flex h-full items-center justify-center p-3">
              <Box className="text-center">
                <Box className={SIDEBAR_INSET_EMPTY_ICON_WRAP}>
                  <Icon name="message-circle" className={SIDEBAR_INSET_EMPTY_ICON} />
                </Box>
                <BodyText as="p" size="sm" className={`mb-4 ${SIDEBAR_INSET_BODY_MUTED}`}>
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
              className={sidebarInsetListRowClass(activeConversationId === activeConversation?.id)}
            >
              <Box className="flex items-start justify-between">
                <Box className="min-w-0 flex-1">
                  <Title as="h3" size="sm" className="text-text-primary mb-1 truncate font-medium">
                    {t("agent.your_agent")}
                  </Title>
                  {localMessages.length > 0 && (
                    <BodyText as="p" className="text-text-secondary truncate text-xs">
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
