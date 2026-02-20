import { useCallback, useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import type { AgentClient } from "packages/config/api";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useMessageScroll } from "packages/hooks/ui";

import { Region } from "@/components/ui/index.web";
import UnifiedMessagingHeader from "@/features/agent/ClientMessaging/UnifiedMessagingHeader";
import UnifiedMessageInput from "@/features/agent/components/UnifiedMessageInput";
import UnifiedMessagesList from "@/features/agent/components/UnifiedMessagesList";
import UnifiedMessagingSidebar from "@/features/agent/components/UnifiedMessagingSidebar";
import { getMessagingConfig } from "@/features/agent/config/messagingConfig";

import { AgentMessagingModals } from "./AgentMessagingModals";
import { useAgentMessagingHandlers } from "./useAgentMessagingHandlers";

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
  const [showSelectAgreementModal, setShowSelectAgreementModal] =
    useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<
    string | null
  >(null);
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
        <section className="relative flex min-w-0 flex-1 flex-col min-h-0 h-full transition-all duration-300 ease-in-out">
          <div className="flex flex-1 flex-col min-h-0">
            <div className="hidden md:block flex-shrink-0">
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
              />
            </div>
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
              <Region
                label="Message list"
                className="scrollbar-hide flex-1 min-h-0 min-w-0 space-y-3 overflow-x-hidden overflow-y-auto px-2 py-3 max-md:pb-mobile-nav"
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
