import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  FileText,
  X,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  propertyAddress?: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export default function AIAssistant() {
  const { chats, refreshChats } = useData();
  const [localChats, setLocalChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPdf, setShowPdf] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI assistant state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("aiAssistantState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.activeChatId) {
          setActiveChatId(parsed.activeChatId);
        }
        if (parsed.message) {
          setMessage(parsed.message);
        }
      } catch (e) {
        console.warn("Invalid AI assistant state data");
      }
    }
  }, []);

  // Save AI assistant state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      activeChatId,
      message,
    };
    localStorage.setItem("aiAssistantState", JSON.stringify(stateToSave));
  }, [activeChatId, message]);

  const activeChat = localChats.find((chat) => chat.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chats from centralized context
  const loadChatsFromContext = () => {
    console.log("[AI_ASSISTANT] Loading chats from centralized context");
    try {
      if (chats && chats.length > 0) {
        // Preserve existing messages from localChats when updating from context
        const updatedChats = chats.map((contextChat) => {
          const existingChat = localChats.find(
            (chat) => chat.id === contextChat.id
          );
          return {
            ...contextChat,
            messages: existingChat ? existingChat.messages : [], // Preserve existing messages
          };
        });

        console.log("[AI_ASSISTANT] Updated chats from context:", {
          chatCount: updatedChats.length,
          chatIds: updatedChats.map((c) => c.id),
          preservedMessages: updatedChats.filter((c) => c.messages.length > 0)
            .length,
        });

        setLocalChats(updatedChats);

        // Set first chat as active if none selected
        if (!activeChatId && updatedChats.length > 0) {
          setActiveChatId(updatedChats[0].id);
        }
      } else {
        console.log("[AI_ASSISTANT] No chats found in context");
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

  // Load chat history and PDF when active chat changes
  useEffect(() => {
    if (activeChatId) {
      const currentChat = chats.find((chat) => chat.id === activeChatId);
      if (currentChat && currentChat.messages.length === 0) {
        console.log(
          `[AI_ASSISTANT] Loading chat history for new active chat: ${activeChatId}`
        );
        loadChatHistory(activeChatId);
      }
      loadPdfForChat(activeChatId);
    }
  }, [activeChatId]);

  // Load PDF for the active chat
  const loadPdfForChat = async (chatId: string) => {
    console.log(`[AI_ASSISTANT] Loading PDF for chatId: ${chatId}`);
    setLoadingPdf(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      console.log(`[AI_ASSISTANT] Making view-url request:`, {
        url: `${apiBaseUrl}/api/v1/report/${chatId}/view-url`,
        hasToken: !!idToken,
      });

      const response = await fetch(
        `${apiBaseUrl}/api/v1/report/${chatId}/view-url`,
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

      console.log(
        `[AI_ASSISTANT] PDF view-url response status: ${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`[AI_ASSISTANT] Received PDF URL for chat ${chatId}`);
        setPdfUrl(data.url);
      } else {
        console.error(
          `[AI_ASSISTANT] Failed to load PDF URL - Status: ${response.status}`
        );
        const errorText = await response.text();
        console.error(`[AI_ASSISTANT] Error response:`, errorText);
        setPdfUrl(null);
      }
    } catch (error) {
      console.error(
        `[AI_ASSISTANT] Failed to load PDF URL for ${chatId}:`,
        error
      );
      setPdfUrl(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Load chat history for a specific chat
  const loadChatHistory = async (chatId: string) => {
    console.log(`[AI_ASSISTANT] Loading chat history for chatId: ${chatId}`);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      console.log(`[AI_ASSISTANT] Making history request:`, {
        url: `${apiBaseUrl}/api/v1/chat/history/${chatId}`,
        hasToken: !!idToken,
      });

      const response = await fetch(
        `${apiBaseUrl}/api/v1/chat/history/${chatId}`,
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

      console.log(`[AI_ASSISTANT] History response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `[AI_ASSISTANT] Received ${
            data.messages?.length || 0
          } messages from history`
        );

        const messages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.message,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.timestamp),
        }));

        console.log(
          `[AI_ASSISTANT] Processed ${messages.length} messages for chat ${chatId}`
        );

        // Update the chat with loaded messages
        setLocalChats((prev: Chat[]) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, messages } : chat
          )
        );

        console.log(
          `[AI_ASSISTANT] Successfully loaded chat history for ${chatId}`
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
    console.log(`[AI_ASSISTANT] Send message triggered`);

    if (!message.trim() || !activeChat) {
      console.warn(`[AI_ASSISTANT] Send message aborted:`, {
        hasMessage: !!message.trim(),
        hasActiveChat: !!activeChat,
        activeChatId,
      });
      return;
    }

    const userMessage = message.trim();
    console.log(`[AI_ASSISTANT] Sending message:`, {
      chatId: activeChatId,
      messageLength: userMessage.length,
      messagePreview: userMessage.substring(0, 50) + "...",
    });

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      timestamp: new Date(),
    };

    // Add user message immediately
    console.log(`[AI_ASSISTANT] Adding user message to UI`);
    setLocalChats((prev: Chat[]) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );

    setMessage("");
    setIsTyping(true);
    console.log(`[AI_ASSISTANT] UI updated, making API request to backend`);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      console.log(`[AI_ASSISTANT] Making chat API request:`, {
        url: `${apiBaseUrl}/api/v1/chat/address/${activeChatId}`,
        hasToken: !!idToken,
        messageLength: userMessage.length,
      });

      const response = await fetch(
        `${apiBaseUrl}/api/v1/chat/address/${activeChatId}`,
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

      console.log(
        `[AI_ASSISTANT] Chat API response status: ${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`[AI_ASSISTANT] Received AI response:`, {
          hasResponse: !!data.response,
          responseLength: data.response?.length || 0,
          messageId: data.message_id,
          hasFunctionCall: !!data.function_call,
        });

        const aiResponse: ChatMessage = {
          id: data.message_id || (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        };

        console.log(`[AI_ASSISTANT] Adding AI response to UI`);
        setLocalChats((prev: Chat[]) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? { ...chat, messages: [...chat.messages, aiResponse] }
              : chat
          )
        );

        console.log(`[AI_ASSISTANT] Successfully processed AI response`);
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

        console.log(`[AI_ASSISTANT] Adding error message to UI`);
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

      console.log(`[AI_ASSISTANT] Adding network error message to UI`);
      setLocalChats((prev: Chat[]) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsTyping(false);
      console.log(
        `[AI_ASSISTANT] Send message completed, typing indicator off`
      );
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
      <div className="flex h-full shadow-lg rounded-xl overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-80 border-r border-beige bg-white rounded-l-xl flex flex-col">
          {/* Fixed Header */}
          <div className="p-4 border-b border-beige bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black">AI Assistant</h2>
            </div>
            <p className="text-sm text-black/60">
              Ask questions about your future home
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
                <MessageCircle className="h-12 w-12 text-black/30 mx-auto mb-2" />
                <p className="text-sm text-black/60">No reports yet</p>
                <p className="text-xs text-black/40 mt-1">
                  Generate a report to start chatting about properties.
                </p>
              </div>
            ) : (
              localChats.map((chat) => (
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

        {/* Chat Area */}
        <div
          className={`${
            showPdf && pdfUrl ? "flex-1" : "flex-1"
          } flex flex-col bg-off-white ${
            showPdf && pdfUrl ? "" : "rounded-r-xl"
          }`}
        >
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-beige bg-white flex items-center justify-between">
                <h3 className="font-medium text-black">{activeChat.title}</h3>
                {pdfUrl && (
                  <button
                    onClick={() => setShowPdf(!showPdf)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-brown text-white rounded-lg hover:bg-brown/80 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{showPdf ? "Hide PDF" : "Show PDF"}</span>
                  </button>
                )}
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

        {/* PDF Viewer */}
        {showPdf && pdfUrl && (
          <div className="w-1/2 bg-white border-l border-beige rounded-r-xl flex flex-col">
            {/* PDF Header */}
            <div className="p-4 border-b border-beige bg-white flex items-center justify-between">
              <h3 className="font-medium text-black">Property Report</h3>
              <button
                onClick={() => setShowPdf(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* PDF Content */}
            <div className="flex-1 relative">
              {loadingPdf ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&view=FitH`}
                  className="w-full h-full border-0"
                  title="Property Report PDF"
                  onLoad={() => {
                    console.log(
                      "[AI_ASSISTANT] PDF iframe loaded successfully"
                    );
                  }}
                  onError={(e) => {
                    console.error("[AI_ASSISTANT] Error loading PDF:", e);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
