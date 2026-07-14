import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import UnifiedMessagingShell from "packages/features/messaging/components/layout/UnifiedMessagingShell";
import { useWorkspaceMessagingSse } from "packages/features/messaging/hooks/data/workspace/useWorkspaceMessagingSse";
import { useWorkspaceUnifiedMessaging } from "packages/features/messaging/hooks/data/workspace/useWorkspaceUnifiedMessaging";
import { useMessagingComposerStoreIntegration } from "packages/features/messaging/hooks/store/useMessagingComposerStoreIntegration";
import { useMessagingComposerStore } from "packages/features/messaging/store";
import { useFirstRenderCommitTimer, useMediaQuery, useMessageScroll } from "packages/hooks/ui";
import { screenUp } from "packages/ui/types/screens";
import { getWorkspaceMessagingPersona } from "packages/utils/comms/messaging/personas/personasRegistry";
import { getDocument } from "packages/utils/core/platform";

import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";

import BrokerageMessagingConversationList from "./BrokerageMessagingConversationList";

type BrokerageMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

/**
 * Brokerage messaging: same Unified* chrome as buyer/agent, workspace conversations API,
 * pinned/auto-ensured SilverKey support connection.
 */
export default function BrokerageMessaging({ setMobileHeaderActions }: BrokerageMessagingProps) {
  useMessagingComposerStoreIntegration();
  useFirstRenderCommitTimer("MESSAGES", "BrokerageMessaging");
  useWorkspaceMessagingSse(true);

  const persona = getWorkspaceMessagingPersona("brokerage");
  const config = getMessagingConfig("brokerage");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    isChatsLoading,
    activeConversation,
    sendMessage: sendMessageApi,
    setActiveConversationId,
    formatTime,
    canSendMessage,
    acknowledgeActiveConversationAsRead,
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
    workspaceConversations,
    eligibleContacts,
    contactNameById,
    isCreating,
    createSupportConversation,
    createFromEligibleContact,
    pinnedSupportTitle,
    isLoadingContacts,
  } = useWorkspaceUnifiedMessaging({ autoEnsureSupport: true });

  const message = useMessagingComposerStore(
    useCallback(
      (s) => (activeConversationId ? (s.draftByConversationId[activeConversationId] ?? "") : ""),
      [activeConversationId]
    )
  );
  const setDraft = useMessagingComposerStore((s) => s.setDraft);
  const clearDraft = useMessagingComposerStore((s) => s.clearDraft);

  const setMessage = useCallback(
    (text: string) => {
      if (!activeConversationId) return;
      setDraft(activeConversationId, text);
    },
    [activeConversationId, setDraft]
  );

  useEffect(() => {
    if (!isSidebarExpanded) return;
    acknowledgeActiveConversationAsRead();
  }, [isSidebarExpanded, acknowledgeActiveConversationAsRead]);

  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const onVisibilityChange = () => {
      if (doc.visibilityState !== "visible") return;
      acknowledgeActiveConversationAsRead();
    };
    doc.addEventListener("visibilitychange", onVisibilityChange);
    return () => doc.removeEventListener("visibilitychange", onVisibilityChange);
  }, [acknowledgeActiveConversationAsRead]);

  const { messagesEndRef, handleMessageListScroll } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
    { hasMoreOlder, isLoadingOlder, loadOlderMessages }
  );

  const handleSendMessage = useCallback(async () => {
    if (!activeConversationId) return;
    const msg = message.trim();
    if (!msg) return;
    clearDraft(activeConversationId);
    await sendMessageApi(msg);
  }, [activeConversationId, clearDraft, message, sendMessageApi]);

  const handleCreateSupport = useCallback(() => {
    void createSupportConversation().then((conv) => {
      if (conv?.id) {
        setActiveConversationId(conv.id);
        setIsSidebarExpanded(false);
      }
    });
  }, [createSupportConversation, setActiveConversationId]);

  const handleCreateFromContact = useCallback(
    (contact: (typeof eligibleContacts)[number]) => {
      void createFromEligibleContact(contact).then((conv) => {
        if (conv?.id) {
          setActiveConversationId(conv.id);
          setIsSidebarExpanded(false);
        }
      });
    },
    [createFromEligibleContact, setActiveConversationId]
  );

  const headerMode = useMemo(
    () => (activeConversationId ? "chat" : "no-client"),
    [activeConversationId]
  );
  const isXlUp = useMediaQuery(screenUp("xl"));
  const suppressDetailHeaderDuplicateActions = isXlUp && !activeConversationId;

  const headerContentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!setMobileHeaderActions) return;

    if (isSidebarExpanded) {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
      return;
    }

    const contentKey = `${headerMode}-${activeConversation?.agent_name ?? ""}`;
    if (headerContentKeyRef.current === contentKey) return;
    headerContentKeyRef.current = contentKey;
    setMobileHeaderActions(
      <UnifiedMessagingHeader
        mode={headerMode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        agentName={activeConversation?.agent_name ?? undefined}
        suppressListColumnActionDuplicates={false}
      />
    );
    return () => {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions, headerMode, isSidebarExpanded, activeConversation?.agent_name]);

  return (
    <UnifiedMessagingShell
      mode="brokerage"
      isSidebarExpanded={isSidebarExpanded}
      onOverlayDismiss={() => setIsSidebarExpanded(false)}
      sidebarHeader={
        <UnifiedMessagingHeader
          mode="messages"
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          className="xl:rounded-tl-xl xl:rounded-tr-none"
        />
      }
      sidebarContent={
        <BrokerageMessagingConversationList
          conversations={workspaceConversations}
          eligibleContacts={eligibleContacts}
          contactNameById={contactNameById}
          isLoading={isChatsLoading}
          isLoadingContacts={isLoadingContacts}
          isCreating={isCreating}
          activeConversationId={activeConversationId}
          pinnedSupportTitle={pinnedSupportTitle}
          emptyMessage={config.sidebar.emptyMessage}
          newConversationLabel={persona.newConversationLabel ?? "Message an agent"}
          setActiveConversationId={setActiveConversationId}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onCreateSupport={handleCreateSupport}
          onCreateFromContact={handleCreateFromContact}
        />
      }
      detailHeader={
        <UnifiedMessagingHeader
          mode={headerMode}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          agentName={activeConversation?.agent_name ?? undefined}
          suppressListColumnActionDuplicates={suppressDetailHeaderDuplicateActions}
        />
      }
      canSendMessage={canSendMessage}
      isLoadingHistory={isLoadingHistory}
      localMessages={localMessages}
      formatTime={formatTime}
      messagesEndRef={messagesEndRef}
      onMessageListScroll={handleMessageListScroll}
      activeConversation={activeConversation}
      hasMoreOlder={hasMoreOlder}
      isLoadingOlder={isLoadingOlder}
      message={message}
      setMessage={setMessage}
      onSendMessage={() => {
        void handleSendMessage();
      }}
      inputDisabled={!activeConversationId}
      inputPlaceholder={persona.inputPlaceholder}
    />
  );
}
