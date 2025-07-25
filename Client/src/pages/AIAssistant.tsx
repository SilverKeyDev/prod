import { useState, useEffect, useRef } from "react";
import { Send, Bot, MessageCircle, Trash2, User as UserIcon} from "lucide-react";

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
  createdAt
  : Date;
}

export default function AIAssistant() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Format address the same way as CompareReportsPage
  const formatAddress = (address: string) => {
    const formattedAddress = address.replace(/_/g, " ");
    return formattedAddress
      .substring(0, formattedAddress.length - 18)
      .trim();
  };

  // Fetch reports and create conversations
  const fetchReportsAndCreateChats = async () => {
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const idToken = localStorage.getItem("id_token");
      
      const response = await fetch(`${baseUrl}/api/v1/report/almostall`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
      });
      
      const json = await response.json();
      
      if (json.success && json.reports) {
        const newChats: Chat[] = json.reports.map((report: any) => ({
          id: report.id,
          title: report.address ? formatAddress(report.address) : `Report ${report.id}`,
          propertyAddress: report.address,
          messages: [],
          createdAt: new Date(report.generatedAt ? report.generatedAt * 1000 : Date.now()),
        }));
        
        setChats(newChats);
        
        // Set the first chat as active if no active chat is set
        if (newChats.length > 0 && !activeChatId) {
          setActiveChatId(newChats[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndCreateChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    // Add user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );

    setMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "Our developers are working hard to deliver this feature soon! Stay tuned",
        role: "assistant",
        timestamp: new Date(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, aiResponse] }
            : chat
        )
      );

      setIsTyping(false);
    }, 2000);
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
        <div className="w-80 border-r border-beige bg-white rounded-l-xl">
          <div className="p-4 border-b border-beige">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black">AI Assistant</h2>
            </div>
            <p className="text-sm text-black/60">
              Ask questions about your future home
            </p>
          </div>

          <div className="overflow-y-auto h-full pb-20">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown mx-auto mb-2"></div>
                <p className="text-sm text-black/60">Loading your property conversations...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="h-12 w-12 text-black/30 mx-auto mb-2" />
                <p className="text-sm text-black/60">No property reports found.</p>
                <p className="text-xs text-black/40 mt-1">Generate a report to start chatting about properties.</p>
              </div>
            ) : (
              chats.map((chat) => (
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
        <div className="flex-1 flex flex-col bg-off-white rounded-r-xl">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-beige bg-white">
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
                    <p className="text-black/60 max-w-md mx-auto">
                      Ask away!
                    </p>
                  </div>
                ) : (
                  <>
                    {activeChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3 ${
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
                              ? "bg-navy text-off-white"
                              : "bg-white border border-beige text-black"
                          }
                        `}
                        >
                          <p className="text-sm whitespace-pre-line">
                            {msg.content}
                          </p>
                          <p
                            className={`text-xs mt-2 ${
                              msg.role === "user"
                                ? "text-off-white/60"
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
                      <div className="flex items-start space-x-3">
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
                <div className="flex items-end space-x-3">
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
                    className="btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
