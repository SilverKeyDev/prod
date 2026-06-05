import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";

import type { ReactNode, UIEvent } from "react";

import MessagingModals from "packages/features/messaging/components/layout/chrome/MessagingModals";
import { loadUnifiedMessagesListModule } from "packages/features/messaging/components/layout/messagesList/unifiedMessagesListDynamicImport";
import { UnifiedMessagesListLoadingHistory } from "packages/features/messaging/components/layout/messagesList/UnifiedMessagesListEmptyStates";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
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
import { Box } from "packages/ui/components/structure/primitives";
import { screenUp } from "packages/ui/types/screens";
import { traceLazyImport } from "packages/utils/core/perf/shellRouteLoadTiming";
import { getDocument, getWindow } from "packages/utils/core/platform";

import { Region } from "@/components/ui";
import { ConnectionRequestsInboxSidebar } from "@/features/agent/components/messaging/chrome";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useConnectionRequests } from "@/features/agent/hooks/data/connections/useConnectionRequests";
import MessagingSidebarShell from "@/features/messaging/components/layout/chrome/MessagingSidebarShell";
import UnifiedMessageInput from "@/features/messaging/components/layout/input/UnifiedMessageInput";
import { isSameMessagingUserId } from "@/features/messaging/utils";

import ClientMessagingConversationList from "./ClientMessagingConversationList";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";

const UnifiedMessagesList = lazy(
  traceLazyImport("MESSAGES", "lazy:UnifiedMessagesList(client)", loadUnifiedMessagesListModule)
);

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

  const isTyping = false;

  // Client inbox: pending agent-initiated requests the buyer may accept or reject (agents auto-accept clients).
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

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory
  );

  const loadOlderGuardRef = useRef(false);
  const handleMessageListScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!hasMoreOlder || isLoadingOlder) return;
      if (e.currentTarget.scrollTop > 120) return;
      if (loadOlderGuardRef.current) return;
      loadOlderGuardRef.current = true;
      void loadOlderMessages().finally(() => {
        getWindow()?.setTimeout(() => {
          loadOlderGuardRef.current = false;
        }, 400);
      });
    },
    [hasMoreOlder, isLoadingOlder, loadOlderMessages]
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

    // When sidebar is expanded on mobile, the sidebar's own internal header takes over.
    // Clear the mobile shell header to avoid duplicate controls.
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
    <Box className="flex h-full w-full overflow-hidden">
      <Box className="relative flex h-full w-full overflow-hidden">
        <MessagingSidebarShell
          isSidebarExpanded={isSidebarExpanded}
          header={
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
        >
          {showInbox ? (
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
          )}
        </MessagingSidebarShell>
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
          <Box className="flex min-h-0 flex-1 flex-col">
            {!showInbox && (
              <Box className="hidden flex-shrink-0 md:block">
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
              </Box>
            )}
            <Box className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Region
                label="Message list"
                className="scrollbar-hide min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
                onScroll={handleMessageListScroll}
              >
                <Suspense fallback={<UnifiedMessagesListLoadingHistory />}>
                  <UnifiedMessagesList
                    mode="client"
                    canSendMessage={canSendMessage}
                    isLoadingHistory={isLoadingHistory}
                    localMessages={localMessages}
                    isTyping={isTyping}
                    formatTime={formatTime}
                    onSearchClick={() => setShowSearchModal(true)}
                    messagesEndRef={messagesEndRef}
                    onRetryMessage={retryMessage}
                    activeConversation={activeConversation ?? null}
                    onAcceptEventRequest={handlers.handleAcceptEventRequest}
                    onCancelEventRequest={handlers.handleCancelEventRequest}
                    acceptedEventRequestIds={new Set()}
                    acceptingEventRequestId={acceptingEventRequestId}
                    isLoadingOlder={isLoadingOlder}
                    hasMoreOlder={hasMoreOlder}
                  />
                </Suspense>
              </Region>
            </Box>
            <UnifiedMessageInput
              mode="client"
              message={message}
              setMessage={setMessage}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
              onAttachmentHome={() => setShowSelectHomeModal(true)}
              onAttachmentDocument={() => setShowSelectDocumentModal(true)}
              onAttachmentCalendar={() => setShowCalendarEventModal(true)}
            />
          </Box>
        </section>
      </Box>
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
    </Box>
  );
}
