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
import { Box } from "packages/ui/components/structure/primitives";
import { sidebarInsetListRowClass } from "packages/ui/components/structure/sidebar/sidebarTheme";

import { BodyText, Button, Title } from "@/components/ui";

type WorkspaceConversationSidebarProps = {
  persona: WorkspaceMessagingPersonaConfig;
  isSidebarExpanded: boolean;
  conversationsBySection: Array<{
    section: WorkspaceMessagingSection;
    items: WorkspaceConversation[];
  }>;
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

export function WorkspaceConversationSidebar({
  persona,
  isSidebarExpanded,
  conversationsBySection,
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
  const hasConversations = conversationsBySection.some(({ items }) => items.length > 0);

  return (
    <MessagingSidebarShell
      isSidebarExpanded={isSidebarExpanded}
      header={
        <Box className="border-border bg-background-surface border-b px-4 py-3">
          <Title size="md" as="h2">
            {persona.sidebarTitle}
          </Title>
          {persona.supportCreateLabel ? (
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
      ) : !hasConversations && persona.emptySidebarTitle ? (
        <Box className="p-4">
          <Title size="sm" as="h3">
            {persona.emptySidebarTitle}
          </Title>
          <BodyText size="sm" muted className="mt-1">
            {persona.emptySidebarMessage}
          </BodyText>
        </Box>
      ) : (
        conversationsBySection.map(({ section, items }) =>
          items.length === 0 ? null : (
            <Box key={section.id} className="border-border border-b py-2">
              <BodyText size="xs" muted className="px-4 pb-1 uppercase tracking-wide">
                {section.title}
              </BodyText>
              {items.map((conv) => {
                const title = workspaceConversationTitle(conv, section.title, contactNameById);
                const unread = conv.unread_count ?? 0;
                const handleSelect = () => onSelectConversation(conv.id);
                return (
                  <Box
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    label={title}
                    className={sidebarInsetListRowClass(activeConversationId === conv.id)}
                    onClick={handleSelect}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect();
                      }
                    }}
                  >
                    <Box className="flex min-w-0 flex-1 items-center justify-between gap-2">
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
                    {conv.last_message ? (
                      <BodyText size="xs" muted className="mt-0.5 line-clamp-1">
                        {conv.last_message}
                      </BodyText>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          )
        )
      )}

      {persona.newConversationLabel && eligibleContacts.length > 0 ? (
        <Box className="border-border border-t py-2">
          <BodyText size="xs" muted className="px-4 pb-1 uppercase tracking-wide">
            {persona.newConversationLabel}
          </BodyText>
          {isLoadingContacts ? (
            <BodyText size="sm" muted className="px-4 py-2">
              Loading contacts…
            </BodyText>
          ) : (
            eligibleContacts.map((contact) => {
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
