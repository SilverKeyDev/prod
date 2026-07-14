import { useCallback, useEffect, useMemo, useRef } from "react";

import type { ReactNode } from "react";

import MessagingModals from "packages/features/messaging/components/layout/chrome/MessagingModals";
import UnifiedMessagingShell from "packages/features/messaging/components/layout/UnifiedMessagingShell";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
import { useAgentChatsSse } from "packages/features/messaging/hooks/data/useAgentChatsSse";
import { useMessagingComposerStoreIntegration } from "packages/features/messaging/hooks/store/useMessagingComposerStoreIntegration";
import { useMessagingComposerStore } from "packages/features/messaging/store";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import {
  useClientMessagingModals,
  useFirstRenderCommitTimer,
  useMediaQuery,
  useMessageScroll,
  useMessagingHandlers,
} from "packages/hooks/ui";
import { screenUp } from "packages/ui/types/screens";
import { getDocument } from "packages/utils/core/platform";

import { ConnectionRequestsInboxSidebar } from "@/features/agent/components/messaging/chrome";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useConnectionRequests } from "@/features/agent/hooks/data/connections/useConnectionRequests";
import { isSameMessagingUserId } from "@/features/messaging/utils";

import ClientMessagingConversationList from "./ClientMessagingConversationList";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";

type ClientMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  clientPersona?: import("@/features/agent/components/messaging/screen/messagingConfig").ClientPersona;
};

export default function ClientMessaging({
  setMobileHeaderActions,
  clientPersona = "buyer",
}: ClientMessagingProps = {}) {
  useMessagingComposerStoreIntegration();
  useFirstRenderCommitTimer("MESSAGES", "ClientMessaging");
  // SIL-180: Subscribe to agent SSE stream so new messages appear without refresh
  useAgentChatsSse(true);

  const { userProfile } = useUserData();
  const agentId = useMemo(() => null, []);
  const showFindAgentInMessagingHeader = !(userProfile?.roles ?? []).includes("agent");
  const clientMessagingConfig = getMessagingConfig("client", { clientPersona });

  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    isChatsLoading,
    activeConversation,
    conversations,
    sendMessage: sendMessageApi,
    sendSharedHomes,
    sendSharedDocument,
    retryMessage,
    refreshActiveConversationHistory,
    refreshChats,
    setActiveConversationId,
    formatTime,
    canSendMessage,
    acknowledgeActiveConversationAsRead,
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
  } = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id,
    agentId: agentId ?? null,
  });

  const clientConversations = useMemo(() => {
    if (!conversations.length) return [];
    if (!userProfile?.id) return conversations;
    const mine = conversations.filter((c) => isSameMessagingUserId(c.client_id, userProfile.id));
    return mine.length > 0 ? mine : conversations;
  }, [conversations, userProfile?.id]);

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

  const { requests: pendingConnectionRequests } = useConnectionRequests({ inboxEnabled: true });
  const pendingConnectionRequestCount = pendingConnectionRequests.length;

  const {
    showSearchModal,
    setShowSearchModal,
    showInbox,
    setShowInbox,
    showSelectHomeModal,
    setShowSelectHomeModal,
    showSelectDocumentModal,
    setShowSelectDocumentModal,
    showCalendarEventModal,
    setShowCalendarEventModal,
    acceptingEventRequestId,
    setAcceptingEventRequestId,
    isSidebarExpanded,
    setIsSidebarExpanded,
  } = useClientMessagingModals();

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

  const handlers = useMessagingHandlers({
    mode: "client",
    activeConversationId,
    agentId,
    clientUserId: userProfile?.id ?? null,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendSharedHomes,
    sendSharedDocument,
  });

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

  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (isChatsLoading) return "chat";
    if (clientConversations.length === 0) return "no-agent";
    return "chat";
  };

  const headerMode = useMemo(() => {
    if (showInbox) return "connection-requests";
    if (isChatsLoading) return "chat";
    if (clientConversations.length === 0) return "no-agent";
    return "chat";
  }, [showInbox, isChatsLoading, clientConversations.length]);

  const isXlUp = useMediaQuery(screenUp("xl"));
  const suppressDetailHeaderDuplicateActions = isXlUp && headerMode === "no-agent";

  const headerContentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!setMobileHeaderActions) return;

    if (isSidebarExpanded) {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
      return;
    }

    const contentKey = `${headerMode}-${isSidebarExpanded}-${
      activeConversation?.agent_name ?? ""
    }-${pendingConnectionRequestCount}-${showFindAgentInMessagingHeader ? 1 : 0}`;
    if (headerContentKeyRef.current === contentKey) return;
    headerContentKeyRef.current = contentKey;
    setMobileHeaderActions(
      <UnifiedMessagingHeader
        mode={headerMode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onSearchClick={showFindAgentInMessagingHeader ? () => setShowSearchModal(true) : undefined}
        onInboxClick={() => setShowInbox(true)}
        onBackClick={() => setShowInbox(false)}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
        agentName={activeConversation?.agent_name}
        suppressListColumnActionDuplicates={false}
      />
    );
    return () => {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
    };
  }, [
    setMobileHeaderActions,
    headerMode,
    isSidebarExpanded,
    setIsSidebarExpanded,
    setShowSearchModal,
    setShowInbox,
    pendingConnectionRequestCount,
    activeConversation?.agent_name,
    isChatsLoading,
    clientConversations.length,
    showFindAgentInMessagingHeader,
  ]);

  return (
    <UnifiedMessagingShell
      mode="client"
      isSidebarExpanded={isSidebarExpanded}
      onOverlayDismiss={() => setIsSidebarExpanded(false)}
      sidebarHeader={
        <UnifiedMessagingHeader
          mode={showInbox ? "connection-requests" : "agents"}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          onInboxClick={() => setShowInbox(true)}
          onBackClick={() => setShowInbox(false)}
          onSearchClick={
            showFindAgentInMessagingHeader ? () => setShowSearchModal(true) : undefined
          }
          pendingConnectionRequestCount={pendingConnectionRequestCount}
          className="xl:rounded-tl-xl xl:rounded-tr-none"
        />
      }
      sidebarContent={
        showInbox ? (
          <ConnectionRequestsInboxSidebar onRequestAccepted={() => setShowInbox(false)} />
        ) : (
          <ClientMessagingConversationList
            clientConversations={clientConversations}
            isLoadingClientConversations={isChatsLoading}
            activeConversationId={activeConversationId}
            setActiveConversationId={setActiveConversationId}
            setIsSidebarExpanded={setIsSidebarExpanded}
            emptyMessage={clientMessagingConfig.sidebar.emptyMessage}
          />
        )
      }
      hideThread={showInbox}
      detailHeader={
        showInbox ? null : (
          <UnifiedMessagingHeader
            mode={getHeaderMode()}
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
            onSearchClick={
              showFindAgentInMessagingHeader ? () => setShowSearchModal(true) : undefined
            }
            onInboxClick={() => setShowInbox(true)}
            onBackClick={() => setShowInbox(false)}
            pendingConnectionRequestCount={pendingConnectionRequestCount}
            agentName={activeConversation?.agent_name}
            suppressListColumnActionDuplicates={suppressDetailHeaderDuplicateActions}
          />
        )
      }
      canSendMessage={canSendMessage}
      isLoadingHistory={isLoadingHistory}
      localMessages={localMessages}
      formatTime={formatTime}
      messagesEndRef={messagesEndRef}
      onMessageListScroll={handleMessageListScroll}
      onRetryMessage={retryMessage}
      activeConversation={activeConversation ?? null}
      onSearchClick={() => setShowSearchModal(true)}
      onAcceptEventRequest={handlers.handleAcceptEventRequest}
      onCancelEventRequest={handlers.handleCancelEventRequest}
      acceptingEventRequestId={acceptingEventRequestId}
      hasMoreOlder={hasMoreOlder}
      isLoadingOlder={isLoadingOlder}
      message={message}
      setMessage={setMessage}
      onSendMessage={() => {
        void handleSendMessage();
      }}
      onAttachmentHome={() => setShowSelectHomeModal(true)}
      onAttachmentDocument={() => setShowSelectDocumentModal(true)}
      onAttachmentCalendar={() => setShowCalendarEventModal(true)}
      modals={
        <MessagingModals
          mode="client"
          showSearchModal={showSearchModal}
          setShowSearchModal={setShowSearchModal}
          showSelectHomeModal={showSelectHomeModal}
          setShowSelectHomeModal={setShowSelectHomeModal}
          showSelectDocumentModal={showSelectDocumentModal}
          setShowSelectDocumentModal={setShowSelectDocumentModal}
          showCalendarEventModal={showCalendarEventModal}
          setShowCalendarEventModal={setShowCalendarEventModal}
          onSelectHomes={handlers.handleSelectHomes}
          onSelectDocument={handlers.handleSelectDocument}
          onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
          sendCalendarEventMessage={sendMessageApi}
        />
      }
    />
  );
}
