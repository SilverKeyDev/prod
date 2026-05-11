import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode, UIEvent } from "react";

import type { AgentClient } from "packages/api";
import { getMessagingConfig } from "packages/features/agent/components/messaging/screen/messagingConfig";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { useConnectionRequests } from "packages/features/agent/hooks/data/useConnectionRequests";
import { useAgentAutoSelectClient } from "packages/features/agent/hooks/ui/useAgentAutoSelectClient";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import MessagingModals from "packages/features/messaging/components/layout/MessagingModals";
import UnifiedMessageInput from "packages/features/messaging/components/layout/UnifiedMessageInput";
import { loadUnifiedMessagesListModule } from "packages/features/messaging/components/layout/unifiedMessagesListDynamicImport";
import { UnifiedMessagesListLoadingHistory } from "packages/features/messaging/components/layout/UnifiedMessagesListEmptyStates";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { useMediaQuery } from "packages/hooks/ui";
import { useMessageScroll } from "packages/hooks/ui";
import { useMessagingHandlers, useMessagingModals } from "packages/hooks/ui";
import { LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";
import { screenUp } from "packages/ui/types/screens";
import { logMessagingCheckpointSinceLatestShellMark } from "packages/utils/perf/messagingRoutePerf";
import { traceLazyImport } from "packages/utils/perf/shellRouteLoadTiming";
import { getDocument, getWindow } from "packages/utils/platform";

import { Region } from "@/components/ui";
import UnifiedMessagingSidebar from "@/features/messaging/components/layout/UnifiedMessagingSidebar";

const UnifiedMessagesList = lazy(
  traceLazyImport(
    LOG_CATEGORIES.MESSAGES,
    "lazy:UnifiedMessagesList(agent)",
    loadUnifiedMessagesListModule
  )
);

type AgentMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function AgentMessaging({ setMobileHeaderActions }: AgentMessagingProps) {
  useFirstRenderCommitTimer(LOG_CATEGORIES.MESSAGES, "AgentMessaging");

  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const agentChats = useAgentChats();

  const mergedClients = useMemo(() => {
    const knownIds = new Set(clients.map((c) => c.id));
    const extras: AgentClient[] = [];

    for (const conv of agentChats.conversations) {
      if (!knownIds.has(conv.client_id)) {
        knownIds.add(conv.client_id);
        extras.push({
          id: conv.client_id,
          name: conv.client_name ?? "Client",
          email: conv.client_email ?? "",
          phone: null,
          profile_picture: conv.client_profile_picture ?? null,
          created_at: conv.created_at ?? null,
          client_kind: "unknown",
          pipeline_stage: "search",
        });
      }
    }

    return extras.length > 0 ? [...clients, ...extras] : clients;
  }, [clients, agentChats.conversations]);

  const [selectedClientId, handleClientSelect] = useAgentAutoSelectClient(
    mergedClients,
    agentChats.conversations,
    isLoadingClients
  );

  const selectedClient = useMemo(
    () => mergedClients.find((c) => c.id === selectedClientId),
    [mergedClients, selectedClientId]
  );

  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    conversations: messagingConversations,
    sendMessage: sendMessageApi,
    sendSharedHomes,
    sendSharedDocument,
    retryMessage,
    refreshActiveConversationHistory,
    refreshChats,
    formatTime,
    canSendMessage,
    acknowledgeActiveConversationAsRead,
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
  } = useMessaging({
    mode: "agent",
    conversationSelector: selectedClientId,
    clientIdForSending: selectedClientId,
    agentChats,
  });

  const [message, setMessage] = useState("");
  const [isTyping] = useState(false);

  const {
    showInbox,
    setShowInbox,
    showSearchModal,
    setShowSearchModal,
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
  } = useMessagingModals("agent");

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

  const { requests: pendingConnectionRequests } = useConnectionRequests();
  const pendingConnectionRequestCount = pendingConnectionRequests.length;

  const handlers = useMessagingHandlers({
    mode: "agent",
    selectedClientId,
    activeConversationId,
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
  const config = getMessagingConfig("agent");
  const isXlUp = useMediaQuery(screenUp("xl"));
  const suppressDetailHeaderDuplicateActions = isXlUp && !showInbox && !selectedClientId;

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedClientId) return;
    const messageToSend = message.trim();
    setMessage("");
    await sendMessageApi(messageToSend);
  }, [message, selectedClientId, sendMessageApi]);

  const getHeaderMode = useCallback(() => {
    if (showInbox) return "connection-requests";
    if (!selectedClientId) return "no-client";
    return "chat";
  }, [showInbox, selectedClientId]);

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

    const headerMode = getHeaderMode();
    const chatTitle = selectedClient ? `Chat with ${selectedClient.name}` : config.header.chatTitle;
    const contentKey = `${headerMode}-${isSidebarExpanded}-${
      selectedClient?.name ?? ""
    }-${chatTitle}-${pendingConnectionRequestCount}`;
    if (headerContentKeyRef.current === contentKey) return;
    headerContentKeyRef.current = contentKey;
    setMobileHeaderActions(
      <UnifiedMessagingHeader
        mode={headerMode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        chatTitle={chatTitle}
        selectedClientName={selectedClient?.name}
        onSearchClick={() => setShowSearchModal(true)}
        onInboxClick={() => setShowInbox(true)}
        onBackClick={() => setShowInbox(false)}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
        suppressListColumnActionDuplicates={false}
      />
    );
    return () => {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
    };
  }, [
    setMobileHeaderActions,
    showInbox,
    selectedClientId,
    isSidebarExpanded,
    setIsSidebarExpanded,
    setShowSearchModal,
    setShowInbox,
    pendingConnectionRequestCount,
    selectedClient?.name,
    selectedClient,
    config.header.chatTitle,
    getHeaderMode,
  ]);

  useLayoutEffect(() => {
    logMessagingCheckpointSinceLatestShellMark("AgentMessaging:firstLayoutCommit");
  }, []);

  return (
    <Box className="flex h-full w-full overflow-hidden">
      <Box className="relative flex h-full w-full overflow-hidden">
        <UnifiedMessagingSidebar
          mode="agent"
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          showInbox={showInbox}
          setShowInbox={setShowInbox}
          activeConversationId={activeConversationId}
          clients={mergedClients}
          isLoadingClients={isLoadingClients}
          selectedClientId={selectedClientId}
          onClientSelect={handleClientSelect}
          conversations={messagingConversations}
          onSearchClick={() => setShowSearchModal(true)}
        />
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
          <Box className="flex min-h-0 flex-1 flex-col">
            {!showInbox && (
              <Box className="hidden flex-shrink-0 md:block">
                <UnifiedMessagingHeader
                  mode={getHeaderMode()}
                  isSidebarExpanded={isSidebarExpanded}
                  setIsSidebarExpanded={setIsSidebarExpanded}
                  chatTitle={
                    selectedClient ? `Chat with ${selectedClient.name}` : config.header.chatTitle
                  }
                  selectedClientName={selectedClient?.name}
                  onSearchClick={() => setShowSearchModal(true)}
                  onInboxClick={() => setShowInbox(true)}
                  onBackClick={() => setShowInbox(false)}
                  pendingConnectionRequestCount={pendingConnectionRequestCount}
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
                    mode="agent"
                    canSendMessage={canSendMessage}
                    isLoadingHistory={isLoadingHistory}
                    localMessages={localMessages}
                    isTyping={isTyping}
                    formatTime={formatTime}
                    messagesEndRef={messagesEndRef}
                    selectedClientName={selectedClient?.name}
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
              mode="agent"
              message={message}
              setMessage={setMessage}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
              disabled={!selectedClientId}
              selectedClientName={selectedClient?.name}
              onAttachmentHome={() => setShowSelectHomeModal(true)}
              onAttachmentDocument={() => setShowSelectDocumentModal(true)}
              onAttachmentCalendar={() => setShowCalendarEventModal(true)}
            />
          </Box>
        </section>
      </Box>
      <MessagingModals
        mode="agent"
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
