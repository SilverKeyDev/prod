import { useState, useCallback, useMemo } from "react";

import { useUserData } from "../../../../../packages/hooks/data/useUserData";
import { useMessaging } from "../../../../../packages/hooks/data/useMessaging";
import { useMessageScroll } from "../../../../../packages/hooks/ui/useMessageScroll";
import { ClientSearchModal } from "../modals";
import UnifiedMessagingSidebar from "../components/UnifiedMessagingSidebar";
import UnifiedMessagesList from "../components/UnifiedMessagesList";
import UnifiedMessageInput from "../components/UnifiedMessageInput";
import UnifiedMessagingHeader from "./UnifiedMessagingHeader";

export default function ClientMessaging() {
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

  // Default: sidebar NOT extended (collapsed) on both mobile and desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Auto-scroll to bottom when messages change
  const { messagesEndRef } = useMessageScroll(localMessages);

  // Handle sending messages (client mode)
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;
    const messageToSend = message.trim();
    // Clear input immediately (optimistically)
    setMessage("");
    await sendMessageApi(messageToSend);
  }, [message, sendMessageApi]);

  const getHeaderMode = () => {
    // Don't show "Connection Requests" in main chat header - it's already in sidebar header
    if (showInbox) return "no-agent";
    if (!agentId) return "no-agent";
    return "chat";
  };

  return (
    <div className="mx-auto h-[calc(100vh-10rem)] max-w-7xl md:mt-0">
      <div className="relative flex h-full overflow-hidden rounded-xl shadow-lg bg-white">
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
        <section
          className={`relative flex flex-1 flex-col h-full bg-white transition-all duration-300 ease-in-out ${
            isSidebarExpanded
              ? "hidden xl:flex xl:rounded-r-xl"
              : "flex rounded-xl xl:rounded-l-none xl:rounded-r-xl"
          }`}
        >
          <div className="flex flex-1 flex-col min-h-0">
            {/* Chat Header */}
            <UnifiedMessagingHeader
              mode={getHeaderMode()}
              isSidebarExpanded={isSidebarExpanded}
              setIsSidebarExpanded={setIsSidebarExpanded}
              onSearchClick={() => setShowSearchModal(true)}
              agentName={activeConversation?.agent_name}
            />

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden min-h-0">
              <div className="scrollbar-hide h-full space-y-3 overflow-y-auto p-3 min-h-0">
                <UnifiedMessagesList
                  mode="client"
                  canSendMessage={canSendMessage}
                  isLoadingHistory={isLoadingHistory}
                  localMessages={localMessages}
                  isTyping={isTyping}
                  formatTime={formatTime}
                  onSearchClick={() => setShowSearchModal(true)}
                  messagesEndRef={messagesEndRef}
                />
              </div>
            </div>

            {/* Message Input */}
            <UnifiedMessageInput
              mode="client"
              message={message}
              setMessage={setMessage}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
            />
          </div>
        </section>
      </div>

      {/* Search Modal */}
      <ClientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </div>
  );
}
