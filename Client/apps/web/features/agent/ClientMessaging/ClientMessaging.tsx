import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { useAgentChats } from "../../../../../packages/hooks/data/useAgentChats";
import { useUserData } from "../../../../../packages/hooks/data/useUserData";
import { AgentSearchModal } from "../modals";
import ClientMessagingSidebar from "./ClientMessagingSidebar";
import ClientChatHeader from "./ClientChatHeader";
import ClientMessagesList from "./ClientMessagesList";
import ClientMessageInput from "./ClientMessageInput";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
};

export default function ClientMessaging() {
  const { userProfile } = useUserData();
  const { conversations, sendMessage, getChatHistory, refreshChats } =
    useAgentChats();

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  // Default: sidebar NOT extended (collapsed) on both mobile and desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const getChatHistoryRef = useRef(getChatHistory);

  // Get agent info from userProfile if available, or from conversation
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

  // Find conversation where current user is the client
  const activeConversation = useMemo(() => {
    if (!userProfile?.id || conversations.length === 0) return undefined;
    return conversations.find((c) => c.client_id === userProfile.id);
  }, [conversations, userProfile?.id]);

  // Set active conversation ID when conversation is found
  const prevConversationIdRef = useRef<string>("");
  useEffect(() => {
    const newId = activeConversation?.id ?? "";
    if (prevConversationIdRef.current !== newId) {
      prevConversationIdRef.current = newId;
      setActiveConversationId(newId);
    }
  }, [activeConversation?.id]);

  // Update agentId from conversation if not in userProfile
  useEffect(() => {
    if (!agentId && activeConversation?.agent_id) {
      // Agent ID will be available through activeConversation
    }
  }, [agentId, activeConversation?.agent_id]);

  // Keep ref updated with latest getChatHistory function
  useEffect(() => {
    getChatHistoryRef.current = getChatHistory;
  }, [getChatHistory]);

  // Load chat history when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setLocalMessages([]);
      return;
    }

    if (loadedHistoryIdsRef.current.has(activeConversationId)) {
      return;
    }

    let cancelled = false;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await getChatHistoryRef.current(activeConversationId);
        if (!cancelled) {
          loadedHistoryIdsRef.current.add(activeConversationId);
          const messages: ChatMessage[] = (data.messages ?? []).map((msg) => ({
            id: msg.id,
            content: msg.message,
            role: msg.role === "agent" ? "agent" : "user",
            timestamp: new Date(msg.timestamp),
            shared_home_id: msg.shared_home_id ?? null,
          }));
          setLocalMessages(messages);
        }
      } catch (err) {
        // Error is handled by the query's error state
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    // If no conversation exists but agent is assigned, create one
    let conversationId = activeConversationId;
    if (!conversationId && agentId) {
      conversationId = "new";
    }

    if (!conversationId && !agentId) return;

    const userMessage = message.trim();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      timestamp: new Date(),
    };

    // Optimistic append
    setLocalMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      await sendMessage(conversationId, userMessage);

      // Reload conversations to get the new conversation ID if it was created
      await refreshChats();

      // Reload history to get server response
      if (conversationId !== "new") {
        const data = await getChatHistoryRef.current(conversationId);
        const messages: ChatMessage[] = (data.messages ?? []).map((msg) => ({
          id: msg.id,
          content: msg.message,
          role: msg.role === "agent" ? "agent" : "user",
          timestamp: new Date(msg.timestamp),
          shared_home_id: msg.shared_home_id ?? null,
        }));
        setLocalMessages(messages);
      } else {
        // If we created a new conversation, refresh conversations to get it
        await refreshChats();
        // Clear loaded history cache so it reloads
        loadedHistoryIdsRef.current.clear();
      }
    } catch (error) {
      // Remove optimistic message on error
      setLocalMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }, [message, activeConversationId, agentId, sendMessage, refreshChats]);

  const formatTime = (date: Date) => {
    const d =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Determine if user can send messages
  const canSendMessage = !!(activeConversationId || agentId);

  return (
    <div className="mx-auto h-[calc(100vh-10rem)] max-w-7xl md:mt-0">
      <div className="relative flex h-full overflow-hidden rounded-xl shadow-lg bg-white">
        {/* Sidebar */}
        <ClientMessagingSidebar
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          showInbox={showInbox}
          setShowInbox={setShowInbox}
          agentId={agentId}
          activeConversation={activeConversation}
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
            <ClientChatHeader
              isSidebarExpanded={isSidebarExpanded}
              setIsSidebarExpanded={setIsSidebarExpanded}
              hasAgent={!!(activeConversation || agentId)}
              onSearchClick={() => setShowSearchModal(true)}
            />

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden min-h-0">
              <div className="scrollbar-hide h-full space-y-3 overflow-y-auto p-3 min-h-0">
                <ClientMessagesList
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
            <ClientMessageInput
              message={message}
              setMessage={setMessage}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
            />
          </div>
        </section>
      </div>

      {/* Search Modal */}
      <AgentSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </div>
  );
}
