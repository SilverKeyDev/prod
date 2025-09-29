import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  Menu,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import MiniLogo from "../../components/ui/asset/MiniLogo";
import Button from "../../components/ui/button/Button";
import KeyTurnLoader from "../../components/ui/loading/KeyTurnLoader";
import { useChats } from "../../../../packages/contexts";
import type { Chat } from "../../../../packages/schemas";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const {
    chats,
    refreshChats,
    sendMessage: contextSendMessage,
    getChatHistory,
  } = useChats();
  const [localChats, setLocalChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Default: sidebar NOT extended (collapsed) on both mobile and desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI assistant state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("aiAssistantState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Record<string, unknown>;
        if (parsed.activeChatId && typeof parsed.activeChatId === "string") {
          setActiveChatId(parsed.activeChatId);
        }
        if (parsed.message) setMessage(parsed.message as string);
      } catch {
        if (console && typeof console.warn === "function") {
          console.warn("Invalid AI assistant state data");
        }
        localStorage.removeItem("aiAssistantState");
      }
    }
  }, []);

  // Save AI assistant state
  useEffect(() => {
    const stateToSave = { activeChatId, message, isTyping };
    localStorage.setItem("aiAssistantState", JSON.stringify(stateToSave));
  }, [activeChatId, message, isTyping]);

  const activeChat = localChats.find((chat: Chat) => chat.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chats from centralized context
  const loadChatsFromContext = () => {
    try {
      if (chats && chats.length > 0) {
        const updatedChats = chats.map((contextChat: Chat) => {
          const existingChat = localChats.find(
            (chat: Chat) => chat.id === contextChat.id,
          );
          return {
            ...contextChat,
            messages: existingChat ? existingChat.messages : [],
          };
        });

        setLocalChats(updatedChats);

        if (!activeChatId && updatedChats.length > 0) {
          setActiveChatId(updatedChats[0].id);
        }
      } else {
        setLocalChats([]);
      }
    } catch (error: unknown) {
      if (console && typeof console.error === "function") {
        console.error(
          "[AI_ASSISTANT] Error loading chats from context:",
          error,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh on mount
  useEffect(() => {
    void refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    void void loadChatsFromContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  // Load chat history when active chat changes
  useEffect(() => {
    if (activeChatId) {
      const currentChat = chats.find((chat: Chat) => chat.id === activeChatId);
      if (currentChat && currentChat.messages.length === 0) {
        void loadChatHistory(activeChatId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const loadChatHistory = async (chatId: string) => {
    try {
      const data = await getChatHistory(chatId);
      if (!data || typeof data !== "object") {
        throw new Error("Invalid chat history response");
      }
      const responseData = data as Record<string, unknown>;
      if (!Array.isArray(responseData.messages)) {
        throw new Error("Invalid messages array in chat history");
      }
      const messages: ChatMessage[] = responseData.messages.map(
        (msg: unknown) => {
          // Type-safe message mapping with proper type guards
          if (!msg || typeof msg !== "object") {
            throw new Error("Invalid message object");
          }
          const msgObj = msg as Record<string, unknown>;
          return {
            id:
              typeof msgObj.id === "string"
                ? msgObj.id
                : typeof msgObj.id === "object" && msgObj.id !== null
                  ? (() => {
                      try {
                        return JSON.stringify(msgObj.id);
                      } catch {
                        return "[Object]";
                      }
                    })()
                  : (() => {
                      try {
                        if (typeof msgObj.id === "string") return msgObj.id;
                        if (typeof msgObj.id === "number")
                          return String(msgObj.id);
                        if (typeof msgObj.id === "boolean")
                          return String(msgObj.id);
                        if (msgObj.id === null || msgObj.id === undefined)
                          return "";
                        return "[Unknown]";
                      } catch {
                        return "[Unknown]";
                      }
                    })(),
            content:
              typeof msgObj.message === "string"
                ? msgObj.message
                : typeof msgObj.message === "object" && msgObj.message !== null
                  ? (() => {
                      try {
                        return JSON.stringify(msgObj.message);
                      } catch {
                        return "[Object]";
                      }
                    })()
                  : (() => {
                      try {
                        if (typeof msgObj.message === "string")
                          return msgObj.message;
                        if (typeof msgObj.message === "number")
                          return String(msgObj.message);
                        if (typeof msgObj.message === "boolean")
                          return String(msgObj.message);
                        if (
                          msgObj.message === null ||
                          msgObj.message === undefined
                        )
                          return "";
                        return "[Unknown]";
                      } catch {
                        return "[Unknown]";
                      }
                    })(),
            role:
              typeof msgObj.role === "string" &&
              (msgObj.role === "user" || msgObj.role === "assistant")
                ? msgObj.role
                : "user",
            timestamp:
              msgObj.timestamp instanceof Date
                ? msgObj.timestamp
                : (() => {
                    try {
                      const timestampStr =
                        typeof msgObj.timestamp === "string"
                          ? msgObj.timestamp
                          : typeof msgObj.timestamp === "object" &&
                              msgObj.timestamp !== null
                            ? (() => {
                                try {
                                  return JSON.stringify(msgObj.timestamp);
                                } catch {
                                  return "[Object]";
                                }
                              })()
                            : (() => {
                                try {
                                  if (typeof msgObj.timestamp === "string")
                                    return msgObj.timestamp;
                                  if (typeof msgObj.timestamp === "number")
                                    return String(msgObj.timestamp);
                                  if (typeof msgObj.timestamp === "boolean")
                                    return String(msgObj.timestamp);
                                  if (
                                    msgObj.timestamp === null ||
                                    msgObj.timestamp === undefined
                                  )
                                    return "";
                                  return "[Unknown]";
                                } catch {
                                  return "[Unknown]";
                                }
                              })();
                      return new Date(timestampStr);
                    } catch {
                      return new Date();
                    }
                  })(),
          };
        },
      );

      setLocalChats((prevChats) =>
        prevChats.map((c: Chat) =>
          c.id === activeChatId ? { ...c, messages } : c,
        ),
      );
    } catch (error: unknown) {
      if (console && typeof console.error === "function") {
        console.error(
          `[AI_ASSISTANT] Failed to load chat history for ${chatId}:`,
          error,
        );
      }
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) {
      if (console && typeof console.warn === "function") {
        console.warn(`[AI_ASSISTANT] Send message aborted:`, {
          hasMessage: !!message.trim(),
          hasActiveChat: !!activeChat,
          activeChatId,
        });
      }
      return;
    }

    const userMessage = message.trim();

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      timestamp: new Date(),
    };

    setLocalChats((prev: Chat[]) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat,
      ),
    );

    setMessage("");
    setIsTyping(true);

    try {
      const data = await contextSendMessage(activeChatId, userMessage);

      const dataObj = (
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {}
      ) as {
        message_id?: string;
        response?: string;
      };

      const aiResponse: ChatMessage = {
        id: dataObj.message_id ?? (Date.now() + 1).toString(),
        content: dataObj.response ?? "",
        role: "assistant",
        timestamp: new Date(),
      };

      setLocalChats((prev: Chat[]) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, aiResponse] }
            : chat,
        ),
      );
    } catch (error: unknown) {
      if (console && typeof console.error === "function") {
        console.error(`[AI_ASSISTANT] Network error sending message:`, error);
      }
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };

      setLocalChats((prev: Chat[]) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date) => {
    // Ensure we have a valid Date object
    const validDate =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return validDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="mx-auto mt-8 h-[calc(100vh-8rem)] max-w-7xl md:mt-0">
      <div className="relative flex h-full overflow-hidden rounded-xl shadow-lg">
        {/* Sidebar (Chat list) */}
        <aside
          className={`${isSidebarExpanded ? "flex" : "hidden"} flex-col lg:flex lg:w-80`}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 rounded-t-xl border-b border-beige bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-medium text-black">
                <MiniLogo size="sm" />
                AI Assistant
              </h2>

              {/* TABLET/MOBILE side arrow button to collapse when extended */}
              {isSidebarExpanded && (
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-beige bg-white px-2 py-1 transition hover:bg-beige/10 lg:hidden"
                  aria-label="Collapse chat list"
                  aria-expanded={isSidebarExpanded}
                >
                  <ChevronLeft className="h-4 w-4 text-black" />
                </button>
              )}
            </div>
            <p className="text-sm text-black/60">
              <button
                onClick={() => navigate("/generate-report")}
                className="cursor-pointer font-bold underline transition-colors hover:text-brown"
              >
                Generate a report
              </button>{" "}
              to be able to ask questions about your future home
            </p>
          </div>

          {/* Scrollable Chat List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center">
                <div className="mb-2">
                  <KeyTurnLoader message="Loading your property conversations..." />
                </div>
              </div>
            ) : localChats.length === 0 ? (
              <div className="p-3 text-center">
                <MessageCircle className="mx-auto mb-3 h-12 w-12 text-black/30" />
                <p className="text-sm text-black/60">No reports yet</p>
                <p className="mt-1 text-xs text-black/40">
                  Generate a report to start chatting about properties.
                </p>
              </div>
            ) : (
              localChats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    // Close sidebar on mobile after selecting chat
                    setIsSidebarExpanded(false);
                  }}
                  className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${activeChatId === chat.id ? "bg-beige/20" : ""} `}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-sm font-medium text-black">
                        {chat.title}
                      </h3>
                      {Array.isArray(chat.messages) &&
                        chat.messages.length > 0 && (
                          <p className="truncate text-xs text-black/50">
                            {(() => {
                              const last = chat.messages[
                                chat.messages.length - 1
                              ] as unknown;
                              if (
                                last &&
                                typeof last === "object" &&
                                "content" in last
                              ) {
                                const c = (last as { content?: unknown })
                                  .content;
                                return typeof c === "string" ? c : "";
                              }
                              return "";
                            })()}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarExpanded && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        {/* Main Chat Section */}
        <section className="flex flex-1 flex-col rounded-r-xl bg-white">
          {/* Chat Header (title + mobile menu button in the same line) */}
          <div className="flex items-center justify-between border-b border-beige bg-white p-3">
            <div className="flex items-center gap-2">
              {/* MOBILE-ONLY MENU/BACK BUTTON (no background color, ChatGPT-like) */}
              <button
                onClick={() => setIsSidebarExpanded((v) => !v)}
                className="inline-flex items-center justify-center rounded-lg p-2 focus:outline-none md:hidden"
                aria-label={
                  isSidebarExpanded ? "Close chat list" : "Open chat list"
                }
                aria-expanded={isSidebarExpanded}
              >
                {isSidebarExpanded ? (
                  <ArrowLeft className="h-5 w-5 text-black" />
                ) : (
                  <Menu className="h-5 w-5 text-black" />
                )}
              </button>

              <h3 className="text-lg font-medium text-black">
                {activeChat ? activeChat.title : "AI Assistant"}
              </h3>
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-3">
            {!activeChat ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-3 h-16 w-16 text-black/40" />
                  <h3 className="mb-2 text-lg font-medium text-black">
                    No conversation selected
                  </h3>
                  <p className="text-sm text-black/60">
                    Choose a conversation or start a new one
                  </p>
                </div>
              </div>
            ) : activeChat.messages.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-beige/30">
                  <MessageCircle className="h-8 w-8 text-black/40" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-black">
                  Start a conversation
                </h3>
                <p className="mx-auto max-w-md text-sm text-black/60">
                  Ask away!
                </p>
              </div>
            ) : (
              <>
                {(activeChat.messages as ChatMessage[]).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-center gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                        <Bot className="h-4 w-4 text-black" />
                      </div>
                    )}

                    <div
                      className={`max-w-lg rounded-xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-olive text-white"
                          : "bg-gray-100 text-black"
                      } `}
                    >
                      <p className="whitespace-pre-line text-sm">
                        {msg.content}
                      </p>
                      <p
                        className={`mt-2 text-xs ${
                          msg.role === "user"
                            ? "text-white/70"
                            : "text-black/60"
                        }`}
                      >
                        {formatTime(
                          msg.timestamp instanceof Date
                            ? msg.timestamp
                            : new Date(),
                        )}
                      </p>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <UserIcon className="h-4 w-4 text-black" />
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

          {/* Message Input */}
          <div className="border-t border-beige bg-white p-3">
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 flex-grow items-center">
                <textarea
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setMessage(e.target.value)
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask about this prooperty!"
                  className="scrollbar-hide h-full w-full resize-none rounded-lg border border-beige px-3 py-2.5 text-sm transition-colors duration-150 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 md:py-3 md:text-base"
                  disabled={isTyping}
                  rows={1}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!message.trim() || isTyping}
                variant="primary"
                className="self-stretch px-4"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
