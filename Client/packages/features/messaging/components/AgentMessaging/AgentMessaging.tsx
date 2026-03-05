import { useCallback, useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import type { AgentClient } from "packages/api";
import UnifiedMessagingHeader from "packages/features/messaging/components/ClientMessaging/UnifiedMessagingHeader";
import UnifiedMessageInput from "packages/features/messaging/components/layout/UnifiedMessageInput";
import UnifiedMessagesList from "packages/features/messaging/components/layout/UnifiedMessagesList";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useMessageScroll } from "packages/hooks/ui";
import { Region } from "packages/ui/components/index.web";

import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import UnifiedMessagingSidebar from "@/features/messaging/components/layout/UnifiedMessagingSidebar";

import { AgentMessagingModals } from "./AgentMessagingModals";
import { useAgentMessagingHandlers } from "./useAgentMessagingHandlers";

type AgentMessagingProps = {
  clients?: AgentClient[];
  isLoadingClients?: boolean;
  selectedClientId: string | null;
  selectedClient?: AgentClient;
  onClientSelect?: (clientId: string) => void;
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
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
  const [showInbox, setShowInbox] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showSelectAgreementModal, setShowSelectAgreementModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handlers = useAgentMessagingHandlers({
    selectedClientId,
    activeConversationId,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowSelectAgreementModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendMessageApi,
  });

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory
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
    selectedClient?.name,
    selectedClient,
    config.header.chatTitle,
    getHeaderMode,
  ]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex h-full w-full overflow-hidden">
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
          <div className="flex min-h-0 flex-1 flex-col">
            {!showInbox && (
              <div className="hidden flex-shrink-0 md:block">
                <UnifiedMessagingHeader
                  mode={getHeaderMode()}
                  isSidebarExpanded={isSidebarExpanded}
                  setIsSidebarExpanded={setIsSidebarExpanded}
                  chatTitle={
                    selectedClient ? `Chat with ${selectedClient.name}` : config.header.chatTitle
                  }
                  selectedClientName={selectedClient?.name}
                  onSearchClick={() => setShowSearchModal(true)}
                />
              </div>
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Region
                label="Message list"
                className="scrollbar-hide max-md:pb-mobile-nav min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
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
            </div>
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
              onAttachmentAgreement={() => setShowSelectAgreementModal(true)}
              onAttachmentCalendar={() => setShowCalendarEventModal(true)}
            />
          </div>
        </section>
      </div>
      <AgentMessagingModals
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        showSelectHomeModal={showSelectHomeModal}
        setShowSelectHomeModal={setShowSelectHomeModal}
        showSelectDocumentModal={showSelectDocumentModal}
        setShowSelectDocumentModal={setShowSelectDocumentModal}
        showSelectAgreementModal={showSelectAgreementModal}
        setShowSelectAgreementModal={setShowSelectAgreementModal}
        showCalendarEventModal={showCalendarEventModal}
        setShowCalendarEventModal={setShowCalendarEventModal}
        selectedClientId={selectedClientId}
        onSelectHome={handlers.handleSelectHome}
        onSelectDocument={handlers.handleSelectDocument}
        onSelectAgreement={handlers.handleSelectAgreement}
        onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
      />
    </div>
  );
}
