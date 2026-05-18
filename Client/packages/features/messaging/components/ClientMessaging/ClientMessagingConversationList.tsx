import { useMemo } from "react";

import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { MessagingSidebarAvatar } from "packages/features/messaging/components/layout/chrome/unifiedMessagingSidebar/MessagingSidebarAvatar";
import { compareConversationsByRecency } from "packages/features/messaging/components/layout/chrome/unifiedMessagingSidebar/unifiedMessagingSidebarModel";
import { getMessagePreview } from "packages/features/messaging/utils/messagePreview";
import { Box } from "packages/ui/components/primitives";
import { SidebarInsetListSelectionStripe } from "packages/ui/components/sidebar/SidebarInsetListSelectionStripe";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
  sidebarInsetListRowSelectedProps,
} from "packages/ui/components/sidebar/sidebarTheme";

import { BodyText, KeyTurnLoader, Title } from "@/components/ui";

type ClientMessagingConversationListProps = {
  clientConversations: AgentConversation[];
  isLoadingClientConversations: boolean;
  activeConversationId: string;
  setActiveConversationId?: (id: string) => void;
  setIsSidebarExpanded: (expanded: boolean) => void;
  emptyMessage: string;
};

export default function ClientMessagingConversationList({
  clientConversations,
  isLoadingClientConversations,
  activeConversationId,
  setActiveConversationId,
  setIsSidebarExpanded,
  emptyMessage,
}: ClientMessagingConversationListProps) {
  const { t } = useLocalization();

  const sortedClientConversations = useMemo(
    () => [...clientConversations].sort(compareConversationsByRecency),
    [clientConversations]
  );

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
            {emptyMessage}
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
        const isSelected = activeConversationId === conv.id;
        return (
          <Box
            key={conv.id}
            role="button"
            tabIndex={0}
            {...sidebarInsetListRowSelectedProps(isSelected)}
            onClick={handleConversationClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleConversationClick();
              }
            }}
            className={sidebarInsetListRowClass(isSelected)}
          >
            {isSelected ? <SidebarInsetListSelectionStripe /> : null}
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
