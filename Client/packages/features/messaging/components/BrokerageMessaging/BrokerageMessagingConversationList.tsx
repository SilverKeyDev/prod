import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import type {
  EligibleContact,
  WorkspaceConversation,
} from "packages/features/messaging/api/workspaceConversations";
import { MessagingSidebarAvatar } from "packages/features/messaging/components/layout/chrome/unifiedMessagingSidebar/MessagingSidebarAvatar";
import { workspaceConversationDisplayName } from "packages/features/messaging/hooks/data/workspace/workspaceUnifiedMessagingMap";
import { getMessagePreview } from "packages/features/messaging/utils/messagePreview";
import {
  eligibleContactsWithoutOpenThread,
  findPlatformSupportConversation,
  nonSupportConversations,
} from "packages/features/messaging/utils/workspace/pinnedSupportSidebar";
import { Box } from "packages/ui/components/structure/primitives";
import { SidebarInsetListSelectionStripe } from "packages/ui/components/structure/sidebar/SidebarInsetListSelectionStripe";
import {
  SIDEBAR_INSET_BODY_MUTED,
  SIDEBAR_INSET_EMPTY_ICON,
  SIDEBAR_INSET_EMPTY_ICON_WRAP,
  sidebarInsetListRowClass,
  sidebarInsetListRowSelectedProps,
} from "packages/ui/components/structure/sidebar/sidebarTheme";

import { BodyText, Button, KeyTurnLoader, Title } from "@/components/ui";

type BrokerageMessagingConversationListProps = {
  conversations: WorkspaceConversation[];
  eligibleContacts: EligibleContact[];
  contactNameById: ReadonlyMap<string, string>;
  isLoading: boolean;
  isLoadingContacts: boolean;
  isCreating: boolean;
  activeConversationId: string;
  pinnedSupportTitle: string;
  emptyMessage: string;
  newConversationLabel: string;
  setActiveConversationId: (id: string) => void;
  setIsSidebarExpanded: (expanded: boolean) => void;
  onCreateSupport: () => void;
  onCreateFromContact: (contact: EligibleContact) => void;
};

function ConversationRow({
  title,
  subtitle,
  selected,
  onSelect,
  leading,
  unread = 0,
}: {
  title: string;
  subtitle?: string | null;
  selected: boolean;
  onSelect: () => void;
  leading?: ReactNode;
  unread?: number;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      {...sidebarInsetListRowSelectedProps(selected)}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={sidebarInsetListRowClass(selected)}
    >
      {selected ? <SidebarInsetListSelectionStripe /> : null}
      <Box className="flex items-center gap-3">
        {leading ?? <MessagingSidebarAvatar name={title} />}
        <Box className="min-w-0 flex-1">
          <Box className="flex min-w-0 items-center justify-between gap-2">
            <Title as="h3" size="sm" className="text-text-primary mb-1 truncate font-medium">
              {title}
            </Title>
            {unread > 0 ? (
              <Box
                className="bg-primary flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs text-white"
                label={`${unread} unread`}
              >
                {unread > 9 ? "9+" : unread}
              </Box>
            ) : null}
          </Box>
          {subtitle ? (
            <BodyText as="p" className="text-text-secondary truncate text-xs">
              {subtitle}
            </BodyText>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Brokerage sidebar: ClientMessagingConversationList visual pattern + pinned SilverKey support
 * + eligible agent footer (workspace data).
 */
export default function BrokerageMessagingConversationList({
  conversations,
  eligibleContacts,
  contactNameById,
  isLoading,
  isLoadingContacts,
  isCreating,
  activeConversationId,
  pinnedSupportTitle,
  emptyMessage,
  newConversationLabel,
  setActiveConversationId,
  setIsSidebarExpanded,
  onCreateSupport,
  onCreateFromContact,
}: BrokerageMessagingConversationListProps) {
  const supportConv = findPlatformSupportConversation(conversations);
  const agentThreads = nonSupportConversations(conversations);
  const contactsForNew = eligibleContactsWithoutOpenThread(eligibleContacts, conversations);

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarExpanded(false);
  };

  const handlePinPress = () => {
    if (supportConv) {
      selectConversation(supportConv.id);
      return;
    }
    if (!isCreating) onCreateSupport();
  };

  if (isLoading && conversations.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center p-3">
        <KeyTurnLoader message="Loading conversations…" />
      </Box>
    );
  }

  const hasRows = Boolean(supportConv) || agentThreads.length > 0;

  return (
    <>
      <Box className="border-border bg-primary-muted/40 border-b">
        <ConversationRow
          title={pinnedSupportTitle}
          subtitle={
            supportConv?.last_message
              ? getMessagePreview({ content: supportConv.last_message })
              : "Message SilverKey support"
          }
          unread={supportConv?.unread_count ?? 0}
          selected={Boolean(supportConv && activeConversationId === supportConv.id)}
          onSelect={handlePinPress}
          leading={
            <Box className="bg-accent-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Icon name="map-pin" size={18} className="text-text-secondary" />
            </Box>
          }
        />
      </Box>

      {!hasRows && !supportConv ? (
        <Box className="flex items-center justify-center p-3">
          <Box className="text-center">
            <Box className={SIDEBAR_INSET_EMPTY_ICON_WRAP}>
              <Icon name="message-circle" className={SIDEBAR_INSET_EMPTY_ICON} />
            </Box>
            <BodyText as="p" size="sm" className={`mb-4 ${SIDEBAR_INSET_BODY_MUTED}`}>
              {emptyMessage}
            </BodyText>
          </Box>
        </Box>
      ) : null}

      {agentThreads.map((conv) => {
        const displayName = workspaceConversationDisplayName(
          conv,
          contactNameById,
          pinnedSupportTitle
        );
        const messagePreview = conv.last_message
          ? getMessagePreview({ content: conv.last_message })
          : null;
        return (
          <ConversationRow
            key={conv.id}
            title={displayName}
            subtitle={messagePreview}
            unread={conv.unread_count ?? 0}
            selected={activeConversationId === conv.id}
            onSelect={() => selectConversation(conv.id)}
          />
        );
      })}

      {newConversationLabel && contactsForNew.length > 0 ? (
        <Box className="border-border border-t py-2">
          <BodyText size="xs" muted className="px-4 pb-1 uppercase tracking-wide">
            {newConversationLabel}
          </BodyText>
          {isLoadingContacts ? (
            <BodyText size="sm" muted className="px-4 py-2">
              Loading contacts…
            </BodyText>
          ) : (
            contactsForNew.map((contact) => (
              <Button
                key={`${contact.kind}:${contact.contact_id}`}
                variant="ghost"
                size="sm"
                label={contact.display_name}
                className={sidebarInsetListRowClass(false)}
                disabled={isCreating}
                onPress={() => onCreateFromContact(contact)}
              >
                <BodyText size="sm">{contact.display_name}</BodyText>
              </Button>
            ))
          )}
        </Box>
      ) : null}
    </>
  );
}
