import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { useUserData } from "../../../../../packages/hooks/data/auth/useUserData";
import { useMessaging } from "../../../../../packages/hooks/data/chat/useMessaging";
import { useMessageScroll } from "../../../../../packages/hooks/ui/useMessageScroll";
import { useAgentChats } from "../../../../../packages/hooks/data/chat/useAgentChats";
import { ClientSearchModal } from "../modals";
import SelectHomeModal from "../modals/SelectHomeModal";
import SelectDocumentModal from "../modals/SelectDocumentModal";
import CalendarEventRequestModal from "../modals/CalendarEventRequestModal";
import UnifiedMessagingSidebar from "../components/UnifiedMessagingSidebar";
import UnifiedMessagesList from "../components/UnifiedMessagesList";
import UnifiedMessageInput from "../components/UnifiedMessageInput";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";
import type { SavedHome } from "../../../../../packages/schemas/property";
import type { DocumentData } from "../../../components/cards/documents/DocumentCard";
import { useIsMobile } from "../../../../../packages/hooks/ui";
import { log, LOG_CATEGORIES } from "../../../../../logger";

type ClientMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
  setMobileBottomActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
  /** Height of the mobile bottom bar (input bar) in px, used to offset messages when useBottomBarInput. */
  mobileBottomBarHeight?: number;
};

export default function ClientMessaging({
  setMobileHeaderActions,
  setMobileBottomActions,
  mobileBottomBarHeight,
}: ClientMessagingProps = {}) {
  const isMobile = useIsMobile();
  const { userProfile } = useUserData();

  // Get agent info from userProfile if available
  const agentId = useMemo(() => {
    let id: string | undefined;
    if (userProfile?.agent_id) {
      if (typeof userProfile.agent_id === "string") {
        // Try to parse as JSON array first, then fall back to comma-separated
        try {
          const parsed = JSON.parse(userProfile.agent_id);
          id = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
          id = userProfile.agent_id.split(",")[0]?.trim();
        }
      } else if (Array.isArray(userProfile.agent_id)) {
        id = userProfile.agent_id[0];
      }
    }
    return id;
  }, [userProfile?.agent_id]);

  // Use shared messaging hook
  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    sendMessage: sendMessageApi,
    retryMessage,
    setActiveConversationId,
    formatTime,
    canSendMessage,
  } = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id,
    agentId: agentId ?? null,
  });

  const [message, setMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTyping, _setIsTyping] = useState(false); // Kept for component interface compatibility, but typing indicator is disabled
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);

  // Default: sidebar NOT extended (collapsed) on both mobile and desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Get sendMessage function for attachments
  const { sendMessage: sendMessageWithAttachment } = useAgentChats();

  // Auto-scroll to bottom when messages change
  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
  );

  const useBottomBarInput = isMobile && !!setMobileBottomActions;

  const handleAttachmentHome = useCallback(() => {
    setShowSelectHomeModal(true);
  }, []);

  const handleAttachmentDocument = useCallback(() => {
    setShowSelectDocumentModal(true);
  }, []);

  const handleAttachmentCalendar = useCallback(() => {
    setShowCalendarEventModal(true);
  }, []);

  // Ref for latest message so handleSendMessage stays stable (avoids effect re-runs)
  const messageRef = useRef(message);
  messageRef.current = message;

  // Handle sending messages (client mode)
  const handleSendMessage = useCallback(async () => {
    const msg = messageRef.current.trim();
    if (!msg) return;
    setMessage("");
    await sendMessageApi(msg);
  }, [sendMessageApi]);

  const getHeaderMode = () => {
    // Don't show "Connection Requests" in main chat header - it's already in sidebar header
    if (showInbox) return "no-agent";
    if (!agentId) return "no-agent";
    return "chat";
  };

  // Refs to prevent redundant setState calls that cause "Maximum update depth exceeded"
  const headerContentKeyRef = useRef<string | null>(null);
  const bottomContentKeyRef = useRef<string | null>(null);

  // Push messaging header into layout MobileTopBar on mobile so it hovers over content.
  useEffect(() => {
    if (!setMobileHeaderActions) return;
    const headerMode = getHeaderMode();
    const contentKey = `${headerMode}-${isSidebarExpanded}-${activeConversation?.agent_name ?? ""}`;
    if (headerContentKeyRef.current === contentKey) return;
    headerContentKeyRef.current = contentKey;

    setMobileHeaderActions(
      <UnifiedMessagingHeader
        mode={headerMode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onSearchClick={() => setShowSearchModal(true)}
        agentName={activeConversation?.agent_name}
      />,
    );
    return () => {
      headerContentKeyRef.current = null;
      setMobileHeaderActions(null);
    };
  }, [
    setMobileHeaderActions,
    showInbox,
    agentId,
    isSidebarExpanded,
    activeConversation?.agent_name,
  ]);

  // On mobile, render the message input in a fixed MobileBottomBar (above the bottom nav).
  useEffect(() => {
    if (!isMobile || !setMobileBottomActions) return;
    const contentKey = `${message}-${isTyping}`;
    if (bottomContentKeyRef.current === contentKey) return;
    bottomContentKeyRef.current = contentKey;

    setMobileBottomActions(
      <UnifiedMessageInput
        mode="client"
        message={message}
        setMessage={setMessage}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onAttachmentHome={handleAttachmentHome}
        onAttachmentDocument={handleAttachmentDocument}
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
    handleAttachmentHome,
    handleAttachmentDocument,
    handleAttachmentCalendar,
  ]);

  // Handle home selection from attachment menu
  const handleSelectHome = useCallback(
    async (home: SavedHome) => {
      if (!activeConversationId && !agentId) return;

      const conversationId = activeConversationId || "new";
      const propertyId = home.home_id || home.address || "";
      const message = "";

      try {
        await sendMessageWithAttachment(
          conversationId,
          message,
          undefined,
          propertyId,
        );
        setShowSelectHomeModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
      }
    },
    [activeConversationId, agentId, sendMessageWithAttachment],
  );

  // Handle document selection from attachment menu
  const handleSelectDocument = useCallback(
    async (document: DocumentData) => {
      if (!activeConversationId && !agentId) {
        log.error(
          LOG_CATEGORIES.MESSAGES,
          "Cannot share document: missing conversation or agent",
          {
            hasActiveConversationId: !!activeConversationId,
            hasAgentId: !!agentId,
          },
        );
        return;
      }

      const conversationId = activeConversationId || "new";
      const documentId = document.id;
      const message = "";

      log.debug(LOG_CATEGORIES.MESSAGES, "Sharing document", {
        conversationId,
        documentId,
        document: {
          id: document.id,
          address: document.address,
          filename: document.filename,
          document_type: document.document_type,
        },
        agentId,
        activeConversationId,
      });

      try {
        await sendMessageWithAttachment(
          conversationId,
          message,
          undefined,
          undefined,
          documentId,
        );
        log.info(LOG_CATEGORIES.MESSAGES, "Document shared successfully", {
          documentId,
          conversationId,
        });
        setShowSelectDocumentModal(false);
      } catch (error) {
        log.error(LOG_CATEGORIES.MESSAGES, "Error sharing document", {
          error,
          documentId,
          conversationId,
          agentId,
        });
      }
    },
    [activeConversationId, agentId, sendMessageWithAttachment],
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
          mode="client"
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          showInbox={showInbox}
          setShowInbox={setShowInbox}
          agentId={agentId}
          activeConversation={activeConversation ?? undefined}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          localMessages={localMessages}
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
                onSearchClick={() => setShowSearchModal(true)}
                agentName={activeConversation?.agent_name}
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
                  mode="client"
                  canSendMessage={canSendMessage}
                  isLoadingHistory={isLoadingHistory}
                  localMessages={localMessages}
                  isTyping={isTyping}
                  formatTime={formatTime}
                  onSearchClick={() => setShowSearchModal(true)}
                  messagesEndRef={messagesEndRef}
                  onRetryMessage={retryMessage}
                />
              </div>
            </div>

            {/* Message Input (desktop/in-flow). On mobile we render this in MobileBottomBar. */}
            {!useBottomBarInput ? (
              <UnifiedMessageInput
                mode="client"
                message={message}
                setMessage={setMessage}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                onAttachmentHome={handleAttachmentHome}
                onAttachmentDocument={handleAttachmentDocument}
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

      {/* Calendar Event Request Modal */}
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={handleCalendarEventSuccess}
      />
    </div>
  );
}
