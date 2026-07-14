import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import type {
  EligibleContact,
  WorkspaceConversation,
} from "packages/features/messaging/api/workspaceConversations";
import MessagingSidebarShell from "packages/features/messaging/components/layout/chrome/MessagingSidebarShell";
import type {
  WorkspaceMessagingPersonaConfig,
  WorkspaceMessagingSection,
} from "packages/features/messaging/types/workspace/personas";
import { workspaceConversationTitle } from "packages/features/messaging/utils/workspace/conversationDisplayLabels";
import {
  eligibleContactsWithoutOpenThread,
  findPlatformSupportConversation,
  nonSupportConversations,
} from "packages/features/messaging/utils/workspace/pinnedSupportSidebar";
import { Box } from "packages/ui/components/structure/primitives";
import { sidebarInsetListRowClass } from "packages/ui/components/structure/sidebar/sidebarTheme";

import { BodyText, Button, Title } from "@/components/ui";

type WorkspaceConversationSidebarProps = {
  persona: WorkspaceMessagingPersonaConfig;
  isSidebarExpanded: boolean;
  conversations: WorkspaceConversation[];
  eligibleContacts: EligibleContact[];
  isLoading: boolean;
  isLoadingContacts: boolean;
  isCreating: boolean;
  activeConversationId: string;
  contactNameById: ReadonlyMap<string, string>;
  onSelectConversation: (id: string) => void;
  onCreateSupport: () => void;
  onCreateFromContact: (contact: EligibleContact) => void;
};

function ConversationRow({
  title,
  lastMessage,
  unread,
  selected,
  onSelect,
  leading,
}: {
  title: string;
  lastMessage?: string | null;
  unread: number;
  selected: boolean;
  onSelect: () => void;
  leading?: ReactNode;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      label={title}
      className={sidebarInsetListRowClass(selected)}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <Box className="flex min-w-0 flex-1 items-start gap-2">
        {leading}
        <Box className="min-w-0 flex-1">
          <Box className="flex min-w-0 items-center justify-between gap-2">
            <BodyText size="sm" className="truncate font-medium">
              {title}
            </BodyText>
            {unread > 0 ? (
              <Box
                className="bg-primary flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs text-white"
                label={`${unread} unread`}
              >
                {unread > 9 ? "9+" : unread}
              </Box>
            ) : null}
          </Box>
          {lastMessage ? (
            <BodyText size="xs" muted className="mt-0.5 line-clamp-1">
              {lastMessage}
            </BodyText>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function SectionedConversationList({
  conversationsBySection,
  activeConversationId,
  contactNameById,
  onSelectConversation,
}: {
  conversationsBySection: Array<{
    section: WorkspaceMessagingSection;
    items: WorkspaceConversation[];
  }>;
  activeConversationId: string;
  contactNameById: ReadonlyMap<string, string>;
  onSelectConversation: (id: string) => void;
}) {
  return (
    <>
      {conversationsBySection.map(({ section, items }) =>
        items.length === 0 ? null : (
          <Box key={section.id} className="border-border border-b py-2">
            <BodyText size="xs" muted className="px-4 pb-1 uppercase tracking-wide">
              {section.title}
            </BodyText>
            {items.map((conv) => {
              const title = workspaceConversationTitle(conv, section.title, contactNameById);
              return (
                <ConversationRow
                  key={conv.id}
                  title={title}
                  lastMessage={conv.last_message}
                  unread={conv.unread_count ?? 0}
                  selected={activeConversationId === conv.id}
                  onSelect={() => onSelectConversation(conv.id)}
                />
              );
            })}
          </Box>
        )
      )}
    </>
  );
}

function PinnedSupportConversationList({
  persona,
  conversations,
  activeConversationId,
  contactNameById,
  isCreating,
  onSelectConversation,
  onCreateSupport,
}: {
  persona: WorkspaceMessagingPersonaConfig;
  conversations: WorkspaceConversation[];
  activeConversationId: string;
  contactNameById: ReadonlyMap<string, string>;
  isCreating: boolean;
  onSelectConversation: (id: string) => void;
  onCreateSupport: () => void;
}) {
  const supportConv = findPlatformSupportConversation(conversations);
  const pinTitle = persona.pinnedSupportTitle ?? "SilverKey support";
  const agentThreads = nonSupportConversations(conversations);
  const agentsSection = persona.sections.find((s) => s.kinds.includes("brokerage_agent"));
  const fallbackSectionTitle = agentsSection?.title ?? "Agents";

  const handlePinPress = () => {
    if (supportConv) {
      onSelectConversation(supportConv.id);
      return;
    }
    if (!isCreating) onCreateSupport();
  };

  return (
    <>
      <Box className="border-border bg-primary-muted/40 border-b">
        <ConversationRow
          title={pinTitle}
          lastMessage={supportConv?.last_message ?? "Message SilverKey support"}
          unread={supportConv?.unread_count ?? 0}
          selected={Boolean(supportConv && activeConversationId === supportConv.id)}
          onSelect={handlePinPress}
          leading={
            <Icon name="map-pin" size={16} className="text-text-secondary mt-0.5 shrink-0" />
          }
        />
      </Box>
      {agentThreads.map((conv) => {
        const title = workspaceConversationTitle(conv, fallbackSectionTitle, contactNameById);
        return (
          <ConversationRow
            key={conv.id}
            title={title}
            lastMessage={conv.last_message}
            unread={conv.unread_count ?? 0}
            selected={activeConversationId === conv.id}
            onSelect={() => onSelectConversation(conv.id)}
          />
        );
      })}
    </>
  );
}

export function WorkspaceConversationSidebar({
  persona,
  isSidebarExpanded,
  conversations,
  eligibleContacts,
  isLoading,
  isLoadingContacts,
  isCreating,
  activeConversationId,
  contactNameById,
  onSelectConversation,
  onCreateSupport,
  onCreateFromContact,
}: WorkspaceConversationSidebarProps) {
  const isPinnedSupport = persona.sidebarLayout === "pinned_support";
  const conversationsBySection = persona.sections.map((section) => ({
    section,
    items: conversations.filter((c) =>
      section.kinds.includes(c.kind as (typeof section.kinds)[number])
    ),
  }));
  const hasConversations = conversations.length > 0;
  const contactsForNew = isPinnedSupport
    ? eligibleContactsWithoutOpenThread(eligibleContacts, conversations)
    : eligibleContacts;

  return (
    <MessagingSidebarShell
      isSidebarExpanded={isSidebarExpanded}
      header={
        <Box className="border-border bg-background-surface border-b px-4 py-3">
          <Title size="md" as="h2">
            {persona.sidebarTitle}
          </Title>
          {!isPinnedSupport && persona.supportCreateLabel ? (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={onCreateSupport}
              disabled={isCreating}
            >
              {persona.supportCreateLabel}
            </Button>
          ) : null}
        </Box>
      }
    >
      {isLoading ? (
        <BodyText size="sm" muted className="p-4">
          Loading conversations…
        </BodyText>
      ) : !hasConversations && !isPinnedSupport && persona.emptySidebarTitle ? (
        <Box className="p-4">
          <Title size="sm" as="h3">
            {persona.emptySidebarTitle}
          </Title>
          <BodyText size="sm" muted className="mt-1">
            {persona.emptySidebarMessage}
          </BodyText>
        </Box>
      ) : isPinnedSupport ? (
        <PinnedSupportConversationList
          persona={persona}
          conversations={conversations}
          activeConversationId={activeConversationId}
          contactNameById={contactNameById}
          isCreating={isCreating}
          onSelectConversation={onSelectConversation}
          onCreateSupport={onCreateSupport}
        />
      ) : (
        <SectionedConversationList
          conversationsBySection={conversationsBySection}
          activeConversationId={activeConversationId}
          contactNameById={contactNameById}
          onSelectConversation={onSelectConversation}
        />
      )}

      {persona.newConversationLabel && contactsForNew.length > 0 ? (
        <Box className="border-border border-t py-2">
          <BodyText size="xs" muted className="px-4 pb-1 uppercase tracking-wide">
            {persona.newConversationLabel}
          </BodyText>
          {isLoadingContacts ? (
            <BodyText size="sm" muted className="px-4 py-2">
              Loading contacts…
            </BodyText>
          ) : (
            contactsForNew.map((contact) => {
              const handleCreate = () => onCreateFromContact(contact);
              return (
                <Button
                  key={`${contact.kind}:${contact.contact_id}`}
                  variant="ghost"
                  size="sm"
                  label={contact.display_name}
                  className={sidebarInsetListRowClass(false)}
                  disabled={isCreating}
                  onPress={handleCreate}
                >
                  <BodyText size="sm">{contact.display_name}</BodyText>
                </Button>
              );
            })
          )}
        </Box>
      ) : null}
    </MessagingSidebarShell>
  );
}
