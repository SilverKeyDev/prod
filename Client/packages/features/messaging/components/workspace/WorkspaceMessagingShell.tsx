import { useCallback, useMemo, useState } from "react";

import type { ReactNode } from "react";

import UnifiedMessageInput from "packages/features/messaging/components/layout/input/UnifiedMessageInput";
import { WorkspaceConversationSidebar } from "packages/features/messaging/components/workspace/WorkspaceConversationSidebar";
import {
  useWorkspaceConversationActions,
  useWorkspaceConversations,
  useWorkspaceEligibleContacts,
  useWorkspaceMessaging,
  useWorkspaceMessagingSse,
} from "packages/features/messaging/hooks/data/workspace";
import { useMessageScroll } from "packages/features/messaging/hooks/ui";
import type { WorkspaceMessagingPersonaId } from "packages/features/messaging/types/workspace/personas";
import { eligibleContactKindsForPersona } from "packages/features/messaging/types/workspace/personas";
import { getWorkspaceMessagingPersona } from "packages/features/messaging/utils/workspace/personasRegistry";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useMediaQuery } from "packages/hooks/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { screenUp } from "packages/ui/types/screens";

import { BodyText, Button, Title } from "@/components/ui";

type WorkspaceMessagingShellProps = {
  persona: WorkspaceMessagingPersonaId;
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function WorkspaceMessagingShell({
  persona: personaId,
}: WorkspaceMessagingShellProps) {
  const persona = getWorkspaceMessagingPersona(personaId);
  const { userProfile } = useUserData();
  const isDesktop = useMediaQuery(screenUp("xl"));
  const [activeConversationId, setActiveConversationId] = useState("");
  const [draft, setDraft] = useState("");

  const contactKinds = useMemo(() => eligibleContactKindsForPersona(persona), [persona]);
  const { data: conversations = [], isLoading, refetch } = useWorkspaceConversations(persona);
  const { data: eligibleContacts = [], isLoading: isLoadingContacts } =
    useWorkspaceEligibleContacts(contactKinds);
  const { isCreating, createSupportConversation, createFromEligibleContact } =
    useWorkspaceConversationActions(personaId);

  useWorkspaceMessagingSse(true);

  const { localMessages, isLoadingHistory, isSending, sendMessage } = useWorkspaceMessaging(
    activeConversationId,
    userProfile?.id
  );

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory
  );

  const contactNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of eligibleContacts) {
      map.set(c.contact_id, c.display_name);
    }
    return map;
  }, [eligibleContacts]);

  const conversationsBySection = useMemo(() => {
    return persona.sections.map((section) => ({
      section,
      items: conversations.filter((c) =>
        section.kinds.includes(c.kind as (typeof section.kinds)[number])
      ),
    }));
  }, [conversations, persona.sections]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeConversationId) return;
    await sendMessage(text);
    setDraft("");
    void refetch();
  }, [activeConversationId, draft, refetch, sendMessage]);

  const handleCreateSupport = useCallback(() => {
    void createSupportConversation().then((conv) => {
      if (conv?.id) setActiveConversationId(conv.id);
    });
  }, [createSupportConversation]);

  const handleCreateFromContact = useCallback(
    (contact: (typeof eligibleContacts)[number]) => {
      void createFromEligibleContact(contact).then((conv) => {
        if (conv?.id) setActiveConversationId(conv.id);
      });
    },
    [createFromEligibleContact]
  );

  const showSidebarOnMobile = !activeConversationId || isDesktop;
  const showThread = Boolean(activeConversationId) || isDesktop;

  return (
    <Box className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden xl:flex-row">
      {showSidebarOnMobile ? (
        <WorkspaceConversationSidebar
          persona={persona}
          isSidebarExpanded={!isDesktop || !activeConversationId}
          conversationsBySection={conversationsBySection}
          eligibleContacts={eligibleContacts}
          isLoading={isLoading}
          isLoadingContacts={isLoadingContacts}
          isCreating={isCreating}
          activeConversationId={activeConversationId}
          contactNameById={contactNameById}
          onSelectConversation={setActiveConversationId}
          onCreateSupport={handleCreateSupport}
          onCreateFromContact={handleCreateFromContact}
        />
      ) : null}

      {showThread ? (
        <Box className="flex min-h-0 flex-1 flex-col">
          {!isDesktop && activeConversationId ? (
            <Box className="border-border border-b px-4 py-2">
              <Button variant="ghost" size="sm" onClick={() => setActiveConversationId("")}>
                Back
              </Button>
            </Box>
          ) : null}

          {!activeConversationId ? (
            <Box className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <Title size="md" as="h3">
                {persona.emptyThreadTitle}
              </Title>
              <BodyText size="sm" muted className="mt-2 max-w-sm">
                {persona.emptyThreadMessage}
              </BodyText>
            </Box>
          ) : (
            <>
              <Box className="flex-1 overflow-y-auto px-4 py-4">
                {isLoadingHistory ? (
                  <BodyText size="sm" muted>
                    Loading messages…
                  </BodyText>
                ) : localMessages.length === 0 ? (
                  <BodyText size="sm" muted>
                    No messages yet. Send the first message below.
                  </BodyText>
                ) : (
                  <>
                    {localMessages.map((msg) => (
                      <Box
                        key={msg.id}
                        className={`mb-3 flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <Box
                          className={`max-w-[85%] rounded-lg px-3 py-2 ${
                            msg.isOwn
                              ? "bg-primary text-white"
                              : "bg-primary-muted text-text-primary"
                          }`}
                        >
                          <BodyText size="sm">{msg.message}</BodyText>
                        </Box>
                      </Box>
                    ))}
                    <Box ref={messagesEndRef} />
                  </>
                )}
              </Box>
              <Box className="border-border border-t p-3">
                <UnifiedMessageInput
                  mode="client"
                  message={draft}
                  setMessage={setDraft}
                  isTyping={false}
                  onSendMessage={() => void handleSend()}
                  disabled={isSending}
                  placeholder={persona.inputPlaceholder}
                />
              </Box>
            </>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
