import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  Menu,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import KeyTurnLoader from "../../components/ui/base/KeyTurnLoader";
import { useChats } from "../../context";
import { Chat } from "../../context/utils";
import MiniLogo from "../../components/ui/base/MiniLogo";
import Button from "../../components/ui/base/Button";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const { chats, refreshChats } = useChats();
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
        const parsed = JSON.parse(savedState);
        if (
          parsed.activeChatId &&
          parsed.activeChatId.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          setActiveChatId(parsed.activeChatId);
        } else if (parsed.activeChatId) {
          console.warn(
            "Clearing invalid activeChatId from localStorage:",
            parsed.activeChatId
          );
          localStorage.removeItem("aiAssistantState");
        }
        if (parsed.message) setMessage(parsed.message);
      } catch {
        console.warn("Invalid AI assistant state data");
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
            (chat: Chat) => chat.id === contextChat.id
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
    } catch (error) {
      console.error("[AI_ASSISTANT] Error loading chats from context:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh on mount
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    loadChatsFromContext();
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
        loadChatHistory(activeChatId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const loadChatHistory = async (chatId: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const cleanChatId = chatId.endsWith(".json")
        ? chatId.slice(0, -5)
        : chatId;

      const response = await fetch(
        `${apiBaseUrl}/api/v1/chat/history/${cleanChatId}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        const messages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.message,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.timestamp),
        }));

        setLocalChats((prevChats) =>
          prevChats.map((c: Chat) =>
            c.id === activeChatId ? { ...c, messages } : c
          )
        );
      } else {
        console.error(
          `[AI_ASSISTANT] Failed to load chat history - Status: ${response.status}`
        );
        const errorText = await response.text();
        console.error(`[AI_ASSISTANT] Error response:`, errorText);
      }
    } catch (error) {
      console.error(
        `[AI_ASSISTANT] Failed to load chat history for ${chatId}:`,
        error
      );
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) {
      console.warn(`[AI_ASSISTANT] Send message aborted:`, {
        hasMessage: !!message.trim(),
        hasActiveChat: !!activeChat,
        activeChatId,
      });
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
          : chat
      )
    );

    setMessage("");
    setIsTyping(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");
      const cleanActiveChatId = activeChatId.endsWith(".json")
        ? activeChatId.slice(0, -5)
        : activeChatId;

      const response = await fetch(
        `${apiBaseUrl}/api/v1/chat/address/${cleanActiveChatId}`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        const aiResponse: ChatMessage = {
          id: data.message_id || (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        };

        setLocalChats((prev: Chat[]) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? { ...chat, messages: [...chat.messages, aiResponse] }
              : chat
          )
        );
      } else {
        console.error(
          `[AI_ASSISTANT] Chat API error - Status: ${response.status}`
        );

        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(`[AI_ASSISTANT] Error response data:`, errorData);

        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error: ${
            errorData.error || "Please try again."
          }`,
          role: "assistant",
          timestamp: new Date(),
        };

        setLocalChats((prev: Chat[]) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? { ...chat, messages: [...chat.messages, errorMessage] }
              : chat
          )
        );
      }
    } catch (error) {
      console.error(`[AI_ASSISTANT] Network error sending message:`, error);
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
            : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] mt-8 md:mt-0">
      <div className="flex h-full shadow-lg rounded-xl overflow-hidden relative">
        {/* Sidebar (Chat list) */}
        <aside
          className={`
            w-80 border-r border-beige bg-white rounded-xl flex flex-col transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isSidebarExpanded ? "translate-x-0" : "-translate-x-full"}
            absolute md:static z-40 h-full
          `}
          aria-hidden={!isSidebarExpanded && window.innerWidth < 768}
        >
          {/* Fixed Header */}
          <div className="p-3 border-b border-beige bg-white flex-shrink-0 rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-black flex items-center gap-2">
                <MiniLogo size="sm" />
                AI Assistant
              </h2>

              {/* TABLET/MOBILE side arrow button to collapse when extended */}
              {isSidebarExpanded && (
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="lg:hidden inline-flex items-center justify-center bg-white border border-beige rounded-lg px-2 py-1 hover:bg-beige/10 transition"
                  aria-label="Collapse chat list"
                  aria-expanded={isSidebarExpanded}
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                </button>
              )}
            </div>
            <p className="text-sm text-black/60">
              <button
                onClick={() => navigate("/generate-report")}
                className="font-bold underline hover:text-brown transition-colors cursor-pointer"
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
                <MessageCircle className="w-12 h-12 text-black/30 mx-auto mb-3" />
                <p className="text-sm text-black/60">No reports yet</p>
                <p className="text-xs text-black/40 mt-1">
                  Generate a report to start chatting about properties.
                </p>
              </div>
            ) : (
              localChats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (window.innerWidth < 768) setIsSidebarExpanded(false);
                  }}
                  className={`
                    p-3 cursor-pointer transition-colors border-b border-beige/50 group hover:bg-beige/10
                    ${activeChatId === chat.id ? "bg-beige/20" : ""}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-black text-sm truncate mb-1">
                        {chat.title}
                      </h3>
                      {chat.messages.length > 0 && (
                        <p className="text-xs text-black/50 truncate">
                          {chat.messages[chat.messages.length - 1].content}
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
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        {/* Main Chat Section */}
        <section className="flex-1 flex flex-col bg-white rounded-r-xl">
          {/* Chat Header (title + mobile menu button in the same line) */}
          <div className="p-3 border-b border-beige bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* MOBILE-ONLY MENU/BACK BUTTON (no background color, ChatGPT-like) */}
              <button
                onClick={() => setIsSidebarExpanded((v) => !v)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 focus:outline-none"
                aria-label={isSidebarExpanded ? "Close chat list" : "Open chat list"}
                aria-expanded={isSidebarExpanded}
              >
                {isSidebarExpanded ? (
                  <ArrowLeft className="w-5 h-5 text-black" />
                ) : (
                  <Menu className="w-5 h-5 text-black" />
                )}
              </button>

              <h3 className="text-lg font-medium text-black">
                {activeChat ? activeChat.title : "AI Assistant"}
              </h3>
            </div>

          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-black/40 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-black mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-sm text-black/60">
                    Choose a conversation or start a new one
                  </p>
                </div>
              </div>
            ) : activeChat.messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-beige/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-black/40" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-black/60 max-w-md mx-auto">
                  Ask away!
                </p>
              </div>
            ) : (
              <>
                {activeChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-center gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-black" />
                      </div>
                    )}

                    <div
                      className={`
                        max-w-lg rounded-xl px-4 py-3
                        ${
                          msg.role === "user"
                            ? "bg-olive text-white"
                            : "bg-gray-100 text-black"
                        }
                      `}
                    >
                      <p className="text-sm whitespace-pre-line">
                        {msg.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          msg.role === "user"
                            ? "text-white/70"
                            : "text-black/60"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-beige rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div className="bg-white border border-beige rounded-xl px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-navy/40 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-navy/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-navy/40 rounded-full animate-bounce"
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
          <div className="p-3 border-t border-beige bg-white">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 flex-grow flex items-center">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about this prooperty!"
                  className="w-full h-full border border-beige rounded-lg px-3 py-2.5 md:py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown transition-colors duration-150 scrollbar-hide text-sm md:text-base"
                  disabled={isTyping}
                  rows={1}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!message.trim() || isTyping}
                variant="primary"
                className="px-4 self-stretch"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
