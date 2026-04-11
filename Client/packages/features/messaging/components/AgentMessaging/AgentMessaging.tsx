import { useCallback, useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import type { AgentClient } from "packages/api";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import MessagingModals from "packages/features/messaging/components/layout/MessagingModals";
import UnifiedMessageInput from "packages/features/messaging/components/layout/UnifiedMessageInput";
import UnifiedMessagesList from "packages/features/messaging/components/layout/UnifiedMessagesList";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
import { useMessageScroll } from "packages/hooks/ui";
import { useMessagingHandlers, useMessagingModals } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import { Region } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import UnifiedMessagingSidebar from "@/features/messaging/components/layout/UnifiedMessagingSidebar";

type AgentMessagingProps = {
  clients?: AgentClient[];
  isLoadingClients?: boolean;
  selectedClientId: string | null;
  selectedClient?: AgentClient;
  onClientSelect?: (clientId: string) => void;
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
};

export default function AgentMessaging({
  clients = [],
  isLoadingClients = false,
  selectedClientId,
  selectedClient,
  onClientSelect,
  setMobileHeaderActions,
}: AgentMessagingProps) {
  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    conversations,
    sendMessage: sendMessageApi,
    sendSharedHome,
    sendSharedDocument,
    retryMessage,
    refreshActiveConversationHistory,
    refreshChats,
    formatTime,
    canSendMessage,
  } = useMessaging({
    mode: "agent",
    conversationSelector: selectedClientId,
    clientIdForSending: selectedClientId,
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
    sendSharedHome,
    sendSharedDocument,
  });

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
  );
  const config = getMessagingConfig("agent");

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedClientId) return;
    const messageToSend = message.trim();
    setMessage("");
    await sendMessageApi(messageToSend);
  }, [message, selectedClientId, sendMessageApi]);

  const getHeaderMode = useCallback(() => {
    if (showInbox) return "connection-requests";
    if (!selectedClientId) return "no-agent";
    return "chat";
  }, [showInbox, selectedClientId]);

  const headerContentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!setMobileHeaderActions) return;
    const headerMode = getHeaderMode();
    const chatTitle = selectedClient
      ? `Chat with ${selectedClient.name}`
      : config.header.chatTitle;
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
      />,
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
          clients={clients}
          isLoadingClients={isLoadingClients}
          selectedClientId={selectedClientId}
          onClientSelect={onClientSelect}
          conversations={conversations}
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
                    selectedClient
                      ? `Chat with ${selectedClient.name}`
                      : config.header.chatTitle
                  }
                  selectedClientName={selectedClient?.name}
                  onSearchClick={() => setShowSearchModal(true)}
                  onInboxClick={() => setShowInbox(true)}
                  onBackClick={() => setShowInbox(false)}
                  pendingConnectionRequestCount={pendingConnectionRequestCount}
                />
              </Box>
            )}
            <Box className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Region
                label="Message list"
                className="scrollbar-hide min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
              >
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
                />
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
        onSelectHome={handlers.handleSelectHome}
        onSelectDocument={handlers.handleSelectDocument}
        onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
        sendCalendarEventMessage={sendMessageApi}
      />
    </Box>
  );
}
