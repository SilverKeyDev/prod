import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  Menu,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import { useAgentChats } from "../../../../../packages/hooks/data/useAgentChats";
import { ConnectionRequestsInbox } from "../modals";
import SharedHomeCard from "../../../components/cards/SharedHomeCard";
import type {
  AgentConversation,
  AgentChatMessage,
} from "../../../../../packages/config/api/agent";
import type { AgentClient } from "../../../../../packages/config/api/agent";

type AgentMessagingProps = {
  selectedClientId: string | null;
  selectedClient?: AgentClient;
};

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
};

export default function AgentMessaging({
  selectedClientId,
  selectedClient,
}: AgentMessagingProps) {
  const {
    conversations,
    sendMessage,
    getChatHistory,
    isLoading,
    refreshChats,
  } = useAgentChats(selectedClientId ?? undefined);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find conversation where current user (agent) is the agent_id and selected client is the client_id
  const activeConversation = useMemo(() => {
    if (!selectedClientId) return null;
    return conversations.find((c) => c.client_id === selectedClientId) ?? null;
  }, [conversations, selectedClientId]);

  // Set active conversation ID when client is selected
  useEffect(() => {
    if (activeConversation) {
      setActiveConversationId(activeConversation.id);
    } else if (selectedClientId) {
      // No conversation exists yet, will be created on first message
      setActiveConversationId("");
    }
  }, [activeConversation, selectedClientId]);

  // Load chat history when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setLocalMessages([]);
      return;
    }

    let cancelled = false;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await getChatHistory(activeConversationId);
        if (!cancelled) {
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
  }, [activeConversationId]); // Remove getChatHistory from deps - it's stable

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedClientId) return;

    if (!activeConversationId) {
      // Create conversation first (backend will handle this)
    }

    const userMessage = message.trim();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: "agent",
      timestamp: new Date(),
    };

    // Optimistic append
    setLocalMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      // If no conversation exists, backend should create one
      const conversationId = activeConversationId || "new";
      await sendMessage(
        conversationId,
        userMessage,
        selectedClientId || undefined
      );

      // Reload conversations to get the new conversation ID if it was created
      await refreshChats();

      // Reload history to get server response
      if (activeConversationId) {
        const data = await getChatHistory(activeConversationId);
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
        // The useEffect will pick up the new conversation and load its history
        await refreshChats();
        // The conversations will be updated via the query, and the useEffect
        // watching activeConversation will set the new conversation ID
      }
    } catch (error) {
      // Remove optimistic message on error
      setLocalMessages((prev) => prev.slice(0, -1));
      // Error is handled by the mutation's error state
    } finally {
      setIsTyping(false);
    }
  }, [
    message,
    selectedClientId,
    activeConversationId,
    sendMessage,
    getChatHistory,
  ]);

  const formatTime = (date: Date) => {
    const d =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <section
      className={`relative flex flex-1 flex-col rounded-r-xl bg-white transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? "hidden xl:flex" : "flex"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Chat Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-beige bg-white p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarExpanded((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg p-2 focus:outline-none xl:hidden"
              aria-label={
                isSidebarExpanded ? "Close client list" : "Open client list"
              }
              aria-expanded={isSidebarExpanded}
            >
              {isSidebarExpanded ? (
                <ArrowLeft className="h-5 w-5 text-black" />
              ) : (
                <Menu className="h-5 w-5 text-black" />
              )}
            </button>

            <h3 className="text-sm font-medium text-black">
              {showInbox
                ? "Connection Requests"
                : selectedClient
                  ? `Chat with ${selectedClient.name}`
                  : "Select a client to start messaging"}
            </h3>
            {selectedClient && !showInbox && (
              <button
                onClick={() => setShowInbox(true)}
                className="rounded-lg p-2 hover:bg-beige/10"
                aria-label="View connection requests"
              >
                <Inbox className="h-5 w-5 text-black" />
              </button>
            )}
            {showInbox && (
              <button
                onClick={() => setShowInbox(false)}
                className="rounded-lg p-2 hover:bg-beige/10"
                aria-label="Back to messages"
              >
                <MessageCircle className="h-5 w-5 text-black" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="scrollbar-hide h-full space-y-3 overflow-y-auto p-3">
            {showInbox ? (
              <ConnectionRequestsInbox
                onRequestAccepted={() => {
                  setShowInbox(false);
                  // The hooks will automatically refetch via query invalidation
                }}
              />
            ) : !selectedClientId ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-3 h-16 w-16 text-black/40" />
                  <h3 className="mb-2 text-lg font-medium text-black">
                    No client selected
                  </h3>
                  <p className="text-sm text-black/60">
                    Choose a client from the list to start messaging
                  </p>
                </div>
              </div>
            ) : isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <KeyTurnLoader message="Loading conversation..." />
              </div>
            ) : localMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-beige/30">
                    <MessageCircle className="h-8 w-8 text-black/40" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-black">
                    Start a conversation
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-black/60">
                    Send a message to {selectedClient?.name ?? "your client"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {localMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-center gap-2 ${
                      msg.role === "agent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <UserIcon className="h-4 w-4 text-black" />
                      </div>
                    )}

                    <div
                      className={`max-w-lg rounded-xl px-4 py-3 ${
                        msg.role === "agent"
                          ? "bg-olive text-white"
                          : "bg-gray-100 text-black"
                      }`}
                    >
                      {/* Show shared home card if present */}
                      {msg.shared_home_id && (
                        <div className="mb-2">
                          <SharedHomeCard
                            homeId={msg.shared_home_id}
                            address={msg.content || undefined}
                          />
                        </div>
                      )}
                      {/* Show message content if not just a shared home */}
                      {(!msg.shared_home_id || msg.content.trim()) && (
                        <p className="whitespace-pre-line text-sm">
                          {msg.content}
                        </p>
                      )}
                      <p
                        className={`mt-2 text-xs ${
                          msg.role === "agent"
                            ? "text-white/70"
                            : "text-black/60"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>

                    {msg.role === "agent" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                        <Bot className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                      <Bot className="h-4 w-4 text-black" />
                    </div>
                    <div className="rounded-xl border border-beige bg-white px-3 py-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-navy/40"></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-navy/40"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-navy/40"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t border-beige bg-white p-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-1 items-center">
              <textarea
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={
                  selectedClientId
                    ? `Message ${selectedClient?.name ?? "client"}...`
                    : "Select a client to start messaging"
                }
                className="scrollbar-hide w-full resize-none rounded-lg border border-beige px-3 py-2.5 text-sm transition-colors duration-150 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 md:py-3 md:text-base"
                disabled={isTyping || !selectedClientId}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping || !selectedClientId}
              variant="primary"
              className="flex-shrink-0 px-4 py-2.5 md:py-3"
            >
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
