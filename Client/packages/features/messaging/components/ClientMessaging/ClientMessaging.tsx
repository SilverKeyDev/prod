import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import MessagingModals from "packages/features/messaging/components/layout/MessagingModals";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useClientMessagingModals, useMessageScroll } from "packages/hooks/ui";
import { useMessagingHandlers } from "packages/hooks/ui";

import { Region } from "@/components/ui";
import UnifiedMessageInput from "@/features/messaging/components/layout/UnifiedMessageInput";
import UnifiedMessagesList from "@/features/messaging/components/layout/UnifiedMessagesList";
import UnifiedMessagingSidebar from "@/features/messaging/components/layout/UnifiedMessagingSidebar";
import { resolvePrimaryAgentId } from "@/features/messaging/utils";

import UnifiedMessagingHeader from "./UnifiedMessagingHeader";

type ClientMessagingProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function ClientMessaging({ setMobileHeaderActions }: ClientMessagingProps = {}) {
  const { userProfile } = useUserData();
  const agentId = useMemo(
    () => resolvePrimaryAgentId(userProfile?.agent_id),
    [userProfile?.agent_id]
  );

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
  });

  const { messagesEndRef } = useMessageScroll(
    localMessages,
    activeConversationId,
    isLoadingHistory
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
    [showInbox, agentId]
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
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
          <div className="flex min-h-0 flex-1 flex-col">
            {!showInbox && (
              <div className="hidden flex-shrink-0 md:block">
                <UnifiedMessagingHeader
                  mode={getHeaderMode()}
                  isSidebarExpanded={isSidebarExpanded}
                  setIsSidebarExpanded={setIsSidebarExpanded}
                  onSearchClick={() => setShowSearchModal(true)}
                  agentName={activeConversation?.agent_name}
                />
              </div>
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Region
                label="Message list"
                className="scrollbar-hide max-md:pb-mobile-nav min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
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
        onSelectHome={handlers.handleSelectHome}
        onSelectDocument={handlers.handleSelectDocument}
        onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
      />
    </div>
  );
}
