import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

import type { ReactNode } from "react";

import type { AgentClient } from "packages/api";
import { getMessagingConfig } from "packages/features/agent/components/messaging/screen/messagingConfig";
import { useAgentClients } from "packages/features/agent/hooks/data/clients/useAgentClients";
import { useAgentAutoSelectClient } from "packages/features/agent/hooks/ui/useAgentAutoSelectClient";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import MessagingModals from "packages/features/messaging/components/layout/chrome/MessagingModals";
import UnifiedMessageInput from "packages/features/messaging/components/layout/input/UnifiedMessageInput";
import { loadUnifiedMessagesListModule } from "packages/features/messaging/components/layout/messagesList/unifiedMessagesListDynamicImport";
import { UnifiedMessagesListLoadingHistory } from "packages/features/messaging/components/layout/messagesList/UnifiedMessagesListEmptyStates";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useMessagingComposerStoreIntegration } from "packages/features/messaging/hooks/store/useMessagingComposerStoreIntegration";
import { useMessagingComposerStore } from "packages/features/messaging/store";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { useMediaQuery } from "packages/hooks/ui";
import { useMessageScroll } from "packages/hooks/ui";
import { useMessagingHandlers, useMessagingModals } from "packages/hooks/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { screenUp } from "packages/ui/types/screens";
import { logMessagingCheckpointSinceLatestShellMark } from "packages/utils/core/perf/messagingRoutePerf";
import { traceLazyImport } from "packages/utils/core/perf/shellRouteLoadTiming";
import { getDocument } from "packages/utils/core/platform";

import { Region } from "@/components/ui";
import AgentMessagingClientList from "@/features/agent/components/messaging/chrome/AgentMessagingClientList";
import MessagingSidebarShell from "@/features/messaging/components/layout/chrome/MessagingSidebarShell";

const UnifiedMessagesList = lazy(
  traceLazyImport("MESSAGES", "lazy:UnifiedMessagesList(agent)", loadUnifiedMessagesListModule)
);

type AgentMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function AgentMessaging({ setMobileHeaderActions }: AgentMessagingProps) {
  useMessagingComposerStoreIntegration();
  useFirstRenderCommitTimer("MESSAGES", "AgentMessaging");

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

  const {
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

  const { messagesEndRef, handleMessageListScroll } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
    { hasMoreOlder, isLoadingOlder, loadOlderMessages }
  );
  const config = getMessagingConfig("agent");
  const isXlUp = useMediaQuery(screenUp("xl"));
  const suppressDetailHeaderDuplicateActions = isXlUp && !selectedClientId;

  const handleSendMessage = useCallback(async () => {
    if (!activeConversationId || !selectedClientId) return;
    const messageToSend = message.trim();
    if (!messageToSend) return;
    clearDraft(activeConversationId);
    await sendMessageApi(messageToSend);
  }, [activeConversationId, selectedClientId, clearDraft, message, sendMessageApi]);

  const getHeaderMode = useCallback(() => {
    if (!selectedClientId) return "no-client";
    return "chat";
  }, [selectedClientId]);

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
    const contentKey = `${headerMode}-${isSidebarExpanded}-${selectedClient?.name ?? ""}-${chatTitle}`;
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
        suppressListColumnActionDuplicates={false}
      />
    );
    return () => {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
    };
  }, [
    setMobileHeaderActions,
    selectedClientId,
    isSidebarExpanded,
    setIsSidebarExpanded,
    setShowSearchModal,
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
        <MessagingSidebarShell
          isSidebarExpanded={isSidebarExpanded}
          onOverlayDismiss={() => setIsSidebarExpanded(false)}
          header={
            <UnifiedMessagingHeader
              mode="clients"
              isSidebarExpanded={isSidebarExpanded}
              setIsSidebarExpanded={setIsSidebarExpanded}
              onSearchClick={() => setShowSearchModal(true)}
              className="xl:rounded-tl-xl xl:rounded-tr-none"
            />
          }
        >
          <AgentMessagingClientList
            clients={mergedClients}
            conversations={messagingConversations}
            isLoadingClients={isLoadingClients}
            selectedClientId={selectedClientId}
            onClientSelect={handleClientSelect}
            setIsSidebarExpanded={setIsSidebarExpanded}
            emptyMessage={config.sidebar.emptyMessage}
          />
        </MessagingSidebarShell>
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
          <Box className="flex min-h-0 flex-1 flex-col">
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
                suppressListColumnActionDuplicates={suppressDetailHeaderDuplicateActions}
              />
            </Box>
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
