import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import MessagingModals from "packages/features/messaging/components/layout/MessagingModals";
import { useMessaging } from "packages/features/messaging/hooks/data/messaging/useMessaging";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useClientMessagingModals, useMessageScroll } from "packages/hooks/ui";
import { useMessagingHandlers } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import { Region } from "@/components/ui";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import UnifiedMessageInput from "@/features/messaging/components/layout/UnifiedMessageInput";
import UnifiedMessagesList from "@/features/messaging/components/layout/UnifiedMessagesList";
import UnifiedMessagingSidebar from "@/features/messaging/components/layout/UnifiedMessagingSidebar";
import { isSameMessagingUserId, resolvePrimaryAgentId } from "@/features/messaging/utils";

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
    isChatsLoading,
    activeConversation,
    conversations,
    sendMessage: sendMessageApi,
    sendSharedHomes,
    sendSharedDocument,
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

  const clientConversations = useMemo(() => {
    if (!conversations.length) return [];
    if (!userProfile?.id) return conversations;
    const mine = conversations.filter((c) => isSameMessagingUserId(c.client_id, userProfile.id));
    return mine.length > 0 ? mine : conversations;
  }, [conversations, userProfile?.id]);

  const [message, setMessage] = useState("");
  const [isTyping] = useState(false);

  const { requests: pendingConnectionRequests } = useConnectionRequests();
  const pendingConnectionRequestCount = pendingConnectionRequests.length;

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
    sendSharedHomes,
    sendSharedDocument,
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
    if (isChatsLoading) return "chat";
    if (clientConversations.length === 0) return "no-agent";
    return "chat";
  };

  const headerMode = useMemo(() => {
    if (showInbox) return "connection-requests";
    if (isChatsLoading) return "chat";
    if (clientConversations.length === 0) return "no-agent";
    return "chat";
  }, [showInbox, isChatsLoading, clientConversations.length]);

  const handleSendMessage = useCallback(async () => {
    const msg = messageRef.current.trim();
    if (!msg) return;
    setMessage("");
    await sendMessageApi(msg);
  }, [sendMessageApi]);

  const headerContentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!setMobileHeaderActions) return;
    const contentKey = `${headerMode}-${isSidebarExpanded}-${
      activeConversation?.agent_name ?? ""
    }-${pendingConnectionRequestCount}`;
    if (headerContentKeyRef.current === contentKey) return;
    headerContentKeyRef.current = contentKey;
    setMobileHeaderActions(
      <UnifiedMessagingHeader
        mode={headerMode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onSearchClick={() => setShowSearchModal(true)}
        onInboxClick={() => setShowInbox(true)}
        onBackClick={() => setShowInbox(false)}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
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
    setShowInbox,
    pendingConnectionRequestCount,
    activeConversation?.agent_name,
    isChatsLoading,
    clientConversations.length,
  ]);

  return (
    <Box className="flex h-full w-full overflow-hidden">
      <Box className="relative flex h-full w-full overflow-hidden">
        <UnifiedMessagingSidebar
          mode="client"
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          showInbox={showInbox}
          setShowInbox={setShowInbox}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          clientConversations={clientConversations}
          isLoadingClientConversations={isChatsLoading}
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
                  onSearchClick={() => setShowSearchModal(true)}
                  onInboxClick={() => setShowInbox(true)}
                  onBackClick={() => setShowInbox(false)}
                  pendingConnectionRequestCount={pendingConnectionRequestCount}
                  agentName={activeConversation?.agent_name}
                />
              </Box>
            )}
            <Box className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Region
                label="Message list"
                className="scrollbar-hide min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
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
            </Box>
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
          </Box>
        </section>
      </Box>
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
        onSelectHomes={handlers.handleSelectHomes}
        onSelectDocument={handlers.handleSelectDocument}
        onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
        sendCalendarEventMessage={sendMessageApi}
      />
    </Box>
  );
}
