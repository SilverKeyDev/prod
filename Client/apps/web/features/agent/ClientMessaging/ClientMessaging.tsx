import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useClientMessagingModals, useMessageScroll } from "packages/hooks/ui";

import { Region } from "@/components/ui/index.web";
import UnifiedMessageInput from "@/features/agent/components/UnifiedMessageInput";
import UnifiedMessagesList from "@/features/agent/components/UnifiedMessagesList";
import UnifiedMessagingSidebar from "@/features/agent/components/UnifiedMessagingSidebar";

import { ClientMessagingModals } from "./ClientMessagingModals";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";
import { useClientMessagingHandlers } from "./useClientMessagingHandlers";

type ClientMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
};

export default function ClientMessaging({
  setMobileHeaderActions,
}: ClientMessagingProps = {}) {
  const { userProfile } = useUserData();
  const agentId = useMemo(() => {
    let id: string | undefined;
    if (userProfile?.agent_id) {
      if (typeof userProfile.agent_id === "string") {
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

  const {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    sendMessage: sendMessageApi,
    retryMessage,
    refreshActiveConversationHistory,
    refreshChats,
    setActiveConversationId,
    formatTime,
    canSendMessage,
  } = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id,
    agentId: agentId ?? null,
  });

  const [message, setMessage] = useState("");
  const [isTyping] = useState(false);

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

  const handlers = useClientMessagingHandlers({
    activeConversationId,
    agentId,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
  });

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory,
  );

  const messageRef = useRef(message);
  messageRef.current = message;

  const getHeaderMode = () => {
    if (showInbox) return "connection-requests";
    if (!activeConversationId) return "no-agent";
    return "chat";
  };

  const headerMode = useMemo(
    () => (showInbox ? "no-agent" : !agentId ? "no-agent" : "chat"),
    [showInbox, agentId],
  );

  const handleSendMessage = useCallback(async () => {
    const msg = messageRef.current.trim();
    if (!msg) return;
    setMessage("");
    await sendMessageApi(msg);
  }, [sendMessageApi]);

  const headerContentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!setMobileHeaderActions) return;
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
    headerMode,
    isSidebarExpanded,
    setIsSidebarExpanded,
    setShowSearchModal,
    activeConversation?.agent_name,
  ]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex h-full w-full overflow-hidden">
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
        <section className="relative flex min-w-0 flex-1 flex-col min-h-0 h-full transition-all duration-300 ease-in-out">
          <div className="flex flex-1 flex-col min-h-0">
            <div className="hidden md:block flex-shrink-0">
              <UnifiedMessagingHeader
                mode={getHeaderMode()}
                isSidebarExpanded={isSidebarExpanded}
                setIsSidebarExpanded={setIsSidebarExpanded}
                onSearchClick={() => setShowSearchModal(true)}
                agentName={activeConversation?.agent_name}
              />
            </div>
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
              <Region
                label="Message list"
                className="scrollbar-hide flex-1 min-h-0 min-w-0 space-y-3 overflow-x-hidden overflow-y-auto px-2 py-3 max-md:pb-mobile-nav"
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
                  activeConversation={activeConversation ?? null}
                  onAcceptEventRequest={handlers.handleAcceptEventRequest}
                  onCancelEventRequest={handlers.handleCancelEventRequest}
                  acceptedEventRequestIds={new Set()}
                  acceptingEventRequestId={acceptingEventRequestId}
                />
              </Region>
            </div>
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
          </div>
        </section>
      </div>
      <ClientMessagingModals
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
      />
    </div>
  );
}
