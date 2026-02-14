import { useState, useCallback, useEffect, useRef } from "react";
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
import type { SavedHome } from "../../../../../packages/schemas/search/property";
import type { DocumentData } from "../../../components/cards/documents/DocumentCard";
import { useIsMobile } from "../../../../../packages/hooks/ui";
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
  setMobileBottomActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
  /** Height of the mobile bottom bar (input bar) in px, used to offset messages when useBottomBarInput. */
  mobileBottomBarHeight?: number;
};

export default function AgentMessaging({
  clients = [],
  isLoadingClients = false,
  selectedClientId,
  selectedClient,
  onClientSelect,
  setMobileHeaderActions,
  setMobileBottomActions,
  mobileBottomBarHeight,
}: AgentMessagingProps) {
  const isMobile = useIsMobile();

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
  const [showSelectAgreementModal, setShowSelectAgreementModal] =
    useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Get sendMessage function for attachments
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();

  // Auto-scroll to bottom when messages change
  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
  );

  const config = getMessagingConfig("agent");
  const useBottomBarInput = isMobile && !!setMobileBottomActions;

  const handleAttachmentHome = useCallback(() => {
    setShowSelectHomeModal(true);
  }, []);

  const handleAttachmentDocument = useCallback(() => {
    setShowSelectDocumentModal(true);
  }, []);

  const handleAttachmentAgreement = useCallback(() => {
    setShowSelectAgreementModal(true);
  }, []);

  const handleAttachmentCalendar = useCallback(() => {
    setShowCalendarEventModal(true);
  }, []);

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

  // Refs to prevent redundant setState calls that cause "Maximum update depth exceeded"
  const headerContentKeyRef = useRef<string | null>(null);
  const bottomContentKeyRef = useRef<string | null>(null);

  // Push messaging header into layout MobileTopBar on mobile so it hovers over content
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
    config.header.chatTitle,
  ]);

  // On mobile, render the message input in a fixed MobileBottomBar (above the bottom nav).
  useEffect(() => {
    if (!isMobile || !setMobileBottomActions) return;
    const contentKey = `${message}-${isTyping}-${selectedClientId}-${selectedClient?.name ?? ""}`;
    if (bottomContentKeyRef.current === contentKey) return;
    bottomContentKeyRef.current = contentKey;

    setMobileBottomActions(
      <UnifiedMessageInput
        mode="agent"
        message={message}
        setMessage={setMessage}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        disabled={!selectedClientId}
        selectedClientName={selectedClient?.name}
        onAttachmentHome={handleAttachmentHome}
        onAttachmentDocument={handleAttachmentDocument}
        onAttachmentAgreement={handleAttachmentAgreement}
        onAttachmentCalendar={handleAttachmentCalendar}
      />,
    );

    return () => {
      bottomContentKeyRef.current = null;
      setMobileBottomActions(null);
    };
  }, [
    isMobile,
    setMobileBottomActions,
    message,
    isTyping,
    handleSendMessage,
    selectedClientId,
    selectedClient?.name,
    handleAttachmentHome,
    handleAttachmentDocument,
    handleAttachmentAgreement,
    handleAttachmentCalendar,
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
          propertyId,
        );
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageWithAttachment],
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
          documentId,
        );
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing document", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageWithAttachment],
  );

  // Handle agreement selection from attachment menu
  const handleSelectAgreement = useCallback(
    async (agreement: any) => {
      if (!selectedClientId) return;

      try {
        // TODO: Update sendMessageWithAttachment to support agreement_id
        // For now, we'll send a text message with agreement info
        await sendMessageApi(`Shared agreement: ${agreement.title}`);
        setShowSelectAgreementModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing agreement", error);
      }
    },
    [selectedClientId, activeConversationId, sendMessageApi],
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
        <section className="relative flex min-w-0 flex-1 flex-col h-full transition-all duration-300 ease-in-out">
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
            <div className="flex-1 min-w-0 overflow-hidden min-h-0">
              <div
                className="scrollbar-hide h-full min-w-0 space-y-3 overflow-x-hidden overflow-y-auto px-2 py-3 min-h-0"
                style={
                  useBottomBarInput && (mobileBottomBarHeight ?? 0) > 0
                    ? { paddingBottom: `${mobileBottomBarHeight}px` }
                    : undefined
                }
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
                />
              </div>
            </div>

            {/* Message Input (desktop/in-flow). On mobile we render this in MobileBottomBar. */}
            {!useBottomBarInput ? (
              <UnifiedMessageInput
                mode="agent"
                message={message}
                setMessage={setMessage}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                disabled={!selectedClientId}
                selectedClientName={selectedClient?.name}
                onAttachmentHome={handleAttachmentHome}
                onAttachmentDocument={handleAttachmentDocument}
                onAttachmentAgreement={handleAttachmentAgreement}
                onAttachmentCalendar={handleAttachmentCalendar}
              />
            ) : null}
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
