import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useChats } from "../../context";
import { Chat } from "../../context/utils";
import MiniLogo from "../../components/ui/MiniLogo";

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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI assistant state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("aiAssistantState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Validate that activeChatId is a proper UUID format (not filename-based)
        if (parsed.activeChatId && parsed.activeChatId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          setActiveChatId(parsed.activeChatId);
        } else if (parsed.activeChatId) {
          console.warn("Clearing invalid activeChatId from localStorage:", parsed.activeChatId);
          localStorage.removeItem("aiAssistantState");
        }
        if (parsed.message) {
          setMessage(parsed.message);
        }
      } catch (e) {
        console.warn("Invalid AI assistant state data");
        localStorage.removeItem("aiAssistantState");
      }
    }
  }, []);

  // Save AI assistant state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      activeChatId,
      message,
      isTyping,
    };
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
        // Preserve existing messages from localChats when updating from context
        const updatedChats = chats.map((contextChat: Chat) => {
          const existingChat = localChats.find(
            (chat: Chat) => chat.id === contextChat.id
          );
          return {
            ...contextChat,
            messages: existingChat ? existingChat.messages : [], // Preserve existing messages
          };
        });

        setLocalChats(updatedChats);

        // Set first chat as active if none selected
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

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    // Always call loadChatsFromContext when chats data changes (including when it's empty)
    loadChatsFromContext();
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
  }, [activeChatId]);


  // Load chat history for a specific chat
  const loadChatHistory = async (chatId: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      // Remove .json extension if present in chatId for chat history API
      const cleanChatId = chatId.endsWith('.json') ? chatId.slice(0, -5) : chatId;
      
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

        // Update the chat with loaded messages
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

    // Add user message immediately
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

      // Remove .json extension if present in activeChatId for chat API
      const cleanActiveChatId = activeChatId.endsWith('.json') ? activeChatId.slice(0, -5) : activeChatId;
      
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
          body: JSON.stringify({
            message: userMessage,
          }),
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

        // Handle error response
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex h-full shadow-lg rounded-xl overflow-hidden relative">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="md:hidden fixed top-1/2 left-2 z-50 bg-white border border-beige rounded-full p-2 shadow-lg transform -translate-y-1/2 transition-all duration-300"
          style={{
            left: isSidebarExpanded ? '18rem' : '0.5rem',
          }}
        >
          {isSidebarExpanded ? (
            <ChevronLeft className="h-4 w-4 text-black" />
          ) : (
            <ChevronRight className="h-4 w-4 text-black" />
          )}
        </button>

        {/* Chat Sidebar */}
        <div className={`
          w-80 border-r border-beige bg-white rounded-l-xl flex flex-col transition-all duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}
          absolute md:static z-40 h-full
        `}>
          {/* Fixed Header */}
          <div className="p-4 border-b border-beige bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black flex items-center gap-2">
                <MiniLogo size="sm" />
                AI Assistant
              </h2>
            </div>
            <p className="text-sm text-black/60">
              <button 
                onClick={() => navigate('/dashboard/generate-report')}
                className="font-bold underline hover:text-brown transition-colors cursor-pointer"
              >
                Generate a report
              </button> to be able to ask questions about your future home 
            </p>
          </div>

          {/* Scrollable Chat List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown mx-auto mb-2"></div>
                <p className="text-sm text-black/60">
                  Loading your property conversations...
                </p>
              </div>
            ) : localChats.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="h-12 w-12 text-black/30 mx-auto mb-4" />
                <p className="text-sm text-black/60">No reports yet</p>
                <p className="text-xs text-black/40 mt-1">
                  Generate a report to start chatting about properties.
                </p>
              </div>
            ) : (
              localChats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`
                  p-4 cursor-pointer transition-colors border-b border-beige/50 group hover:bg-beige/10
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
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarExpanded && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-off-white rounded-r-xl relative z-10">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-beige bg-white flex items-center justify-between">
                <h3 className="font-medium text-black">{activeChat.title}</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {activeChat.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-beige/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-black/40" />
                    </div>
                    <h3 className="text-lg font-medium text-black mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-black/60 max-w-md mx-auto">Ask away!</p>
                  </div>
                ) : (
                  <>
                    {activeChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-center space-x-3 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-black" />
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
                            <UserIcon className="h-4 w-4 text-black" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-black" />
                        </div>
                        <div className="bg-white border border-beige rounded-xl px-4 py-3">
                          <div className="flex space-x-1">
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
              <div className="p-4 border-t border-beige bg-white">
                <div className="flex items-stretch space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Ask about property pricing, market trends, or analysis..."
                      className="input-field resize-none h-12 py-3 scrollbar-hide"
                      disabled={isTyping}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || isTyping}
                    className="bg-olive hover:bg-olive-light text-white font-medium px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 self-stretch"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No conversation selected
                </h3>
                <p className="text-black/60">
                  Choose a conversation or start a new one
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
