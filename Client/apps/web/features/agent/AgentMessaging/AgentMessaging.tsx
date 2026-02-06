import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

import { useMessaging } from "../../../../../packages/hooks/data/chat/useMessaging";
import { useMessageScroll } from "../../../../../packages/hooks/ui/useMessageScroll";
import { useAgentChats } from "../../../../../packages/hooks/data/chat/useAgentChats";
import { ClientSearchModal } from "../modals";
import SelectHomeModal from "../modals/SelectHomeModal";
import SelectDocumentModal from "../modals/SelectDocumentModal";
import SelectAgreementModal from "../modals/SelectAgreementModal";
import CalendarEventRequestModal from "../modals/CalendarEventRequestModal";
import UnifiedMessagingSidebar from "../components/UnifiedMessagingSidebar";
import UnifiedMessagesList from "../components/UnifiedMessagesList";
import UnifiedMessageInput from "../components/UnifiedMessageInput";
import UnifiedMessagingHeader from "../ClientMessaging/UnifiedMessagingHeader";
import { getMessagingConfig } from "../config/messagingConfig";
import type { AgentClient } from "../../../../../packages/config/api";
import type { SavedHome } from "../../../../../packages/schemas/property";
import type { DocumentData } from "../../../components/cards/documents/DocumentCard";
import { log, LOG_CATEGORIES } from "../../../../../logger";

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
  // Use shared messaging hook
  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    conversations,
    sendMessage: sendMessageApi,
    retryMessage,
    formatTime,
    canSendMessage,
  } = useMessaging({
    mode: "agent",
    conversationSelector: selectedClientId,
    clientIdForSending: selectedClientId,
  });

  const [message, setMessage] = useState("");
  const [isTyping] = useState(false); // Always false - typing indicator is disabled for agent-client messaging
  const [showInbox, setShowInbox] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showSelectAgreementModal, setShowSelectAgreementModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Get sendMessage function for attachments
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();

  // Auto-scroll to bottom when messages change
  const { messagesEndRef } = useMessageScroll(localMessages, activeConversationId, isLoadingHistory);

  const config = getMessagingConfig("agent");

  // Handle sending messages (agent mode - requires selectedClientId)
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedClientId) return;
    const messageToSend = message.trim();
    // Clear input immediately (optimistically)
    setMessage("");
    await sendMessageApi(messageToSend);
  }, [message, selectedClientId, sendMessageApi]);

  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (!selectedClientId) return "no-agent";
    return "chat";
  };

  // Push messaging header into layout MobileTopBar on mobile so it hovers over content
  useEffect(() => {
    if (!setMobileHeaderActions) return;
    setMobileHeaderActions(
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
    );
    return () => setMobileHeaderActions(null);
  }, [
    setMobileHeaderActions,
    showInbox,
    selectedClientId,
    isSidebarExpanded,
    selectedClient?.name,
    config.header.chatTitle,
  ]);

  // Handle home selection from attachment menu
  const handleSelectHome = useCallback(
    async (home: SavedHome) => {
      if (!selectedClientId) return;

      const conversationId = activeConversationId || "new";
      const propertyId = home.home_id || home.address || "";
      const message = "";

      try {
        await sendMessageWithAttachment(
          conversationId,
          message,
          selectedClientId,
          propertyId
        );
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageWithAttachment]
  );

  // Handle document selection from attachment menu
  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!selectedClientId) return;

      const conversationId = activeConversationId || "new";
      const documentId = document.id;
      const message = "";

      try {
        await sendMessageWithAttachment(
          conversationId,
          message,
          selectedClientId,
          undefined,
          documentId
        );
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing document", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageWithAttachment]
  );

  // Handle agreement selection from attachment menu
  const handleSelectAgreement = useCallback(
    async (agreement: any) => {
      if (!selectedClientId) return;

      const conversationId = activeConversationId || "new";
      const agreementId = agreement.id;
      const message = "";

      try {
        // TODO: Update sendMessageWithAttachment to support agreement_id
        // For now, we'll send a text message with agreement info
        await sendMessageApi(`Shared agreement: ${agreement.title}`);
        setShowSelectAgreementModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing agreement", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageApi]
  );

  // Handle calendar event request
  const handleCalendarEventSuccess = useCallback(() => {
    setShowCalendarEventModal(false);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex h-full w-full overflow-hidden">
        {/* Sidebar */}
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

        {/* Main Chat Section */}
        <section
          className="relative flex flex-1 flex-col h-full transition-all duration-300 ease-in-out"
        >
          <div className="flex flex-1 flex-col min-h-0">
            {/* Chat Header - hidden on mobile; shown in MobileTopBar (hovering) via setMobileHeaderActions */}
            <div className="hidden md:block">
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

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden min-h-0">
              <div className="scrollbar-hide h-full space-y-3 overflow-y-auto p-3 min-h-0">
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
                />
              </div>
            </div>

            {/* Message Input */}
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

      {/* Search Modal */}
      <ClientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Select Home Modal */}
      <SelectHomeModal
        isOpen={showSelectHomeModal}
        onClose={() => setShowSelectHomeModal(false)}
        onSelect={handleSelectHome}
      />

      {/* Select Document Modal */}
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={() => setShowSelectDocumentModal(false)}
        onSelect={handleSelectDocument}
      />

      {/* Select Agreement Modal */}
      <SelectAgreementModal
        isOpen={showSelectAgreementModal}
        onClose={() => setShowSelectAgreementModal(false)}
        onSelect={handleSelectAgreement}
        clientId={selectedClientId ?? undefined}
      />

      {/* Calendar Event Request Modal */}
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={handleCalendarEventSuccess}
      />
    </div>
  );
}
