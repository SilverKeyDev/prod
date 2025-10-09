import {
  Send,
  Bot,
  MessageCircle,
  User as UserIcon,
  Menu,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

import MiniLogo from "../../../components/ui/asset/MiniLogo";
import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import { useChats } from "../../../../../packages/contexts";
import type { Chat } from "../../../../../packages/schemas";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

export default function AIAssistant() {
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

  // Gates to prevent once-only transitions from re-triggering
  const hasFinishedInitialSyncRef = useRef(false);
  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const previousMessageCountRef = useRef<number>(0);

  // ---------- Load persisted UI state on mount ----------
  useEffect(() => {
    const savedState = localStorage.getItem("aiAssistantState");
    if (!savedState) return;
    try {
      const parsed = JSON.parse(savedState) as Record<string, unknown>;
      if (typeof parsed.activeChatId === "string") {
        setActiveChatId(parsed.activeChatId);
      }
      if (typeof parsed.message === "string") {
        setMessage(parsed.message);
      }
    } catch {
      console.warn("Invalid AI assistant state data");
      localStorage.removeItem("aiAssistantState");
    }
  }, []);

  // ---------- Persist minimal UI state (exclude highly volatile bits like isTyping) ----------
  useEffect(() => {
    const stateToSave = { activeChatId, message };
    localStorage.setItem("aiAssistantState", JSON.stringify(stateToSave));
  }, [activeChatId, message]);

  // Active chat derived from local (stable) list
  const activeChat = useMemo(
    () => localChats.find((c) => c.id === activeChatId),
    [localChats, activeChatId]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ---------- Compute a stable signature from context chats (ids + titles only) ----------
  const contextSignature = useMemo(() => {
    if (!Array.isArray(chats) || chats.length === 0) return "";
    // sort to avoid order-based churn if upstream array order is unstable
    const normalized = [...chats]
      .map((c) => ({ id: c.id, title: c.title ?? "" }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return JSON.stringify(normalized);
  }, [chats]);

  // ---------- Sync from context CHATS → local state WITHOUT loops ----------
  useEffect(() => {
    // If there are no chats yet, just clear local list and finish initial loading once
    if (!Array.isArray(chats) || chats.length === 0) {
      // Only update if we actually need to clear something
      setLocalChats((prev) => (prev.length ? [] : prev));
      if (!hasFinishedInitialSyncRef.current) {
        hasFinishedInitialSyncRef.current = true;
        setIsLoading(false);
      }
      return;
    }

    // Map context chats to local while preserving any existing local messages by id
    setLocalChats((prevChats) => {
      const prevMessagesById = new Map<string, ChatMessage[]>(
        prevChats.map((c) => [
          c.id,
          Array.isArray(c.messages) ? (c.messages as ChatMessage[]) : [],
        ])
      );

      // Build the new array
      const nextLocal = chats.map((ctx) => {
        const preservedMsgs = prevMessagesById.get(ctx.id) ?? [];
        // IMPORTANT: return same messages array reference if unchanged to avoid downstream deps firing
        return { ...ctx, messages: preservedMsgs };
      });

      // Initialize active chat if not set
      if (!activeChatId && nextLocal.length > 0) {
        // We can safely set it here via a microtask to avoid double render within this reducer phase.
        queueMicrotask(() => {
          setActiveChatId((curr) => (curr ? curr : nextLocal[0].id));
        });
      }

      // Finish initial loading exactly once
      if (!hasFinishedInitialSyncRef.current) {
        hasFinishedInitialSyncRef.current = true;
        setIsLoading(false);
      }

      return nextLocal;
    });
  }, [contextSignature]); // <- only runs when ids/titles change, not on every new array identity

  // ---------- Kick off a refresh on mount ----------
  useEffect(() => {
    void refreshChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Scroll only when new messages are appended (not on initial load) ----------
  useEffect(() => {
    const count = activeChat?.messages?.length ?? 0;
    const prev = previousMessageCountRef.current;
    if (count > prev && prev > 0) {
      scrollToBottom();
    }
    previousMessageCountRef.current = count;
  }, [activeChat?.messages, scrollToBottom]);

  // ---------- Load chat history once per active chat (if messages empty) ----------
  const loadChatHistory = useCallback(
    async (chatId: string) => {
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
          (msg: any) => {
            const id =
              typeof msg?.id === "string"
                ? msg.id
                : typeof msg?.id !== "undefined"
                  ? JSON.stringify(msg.id)
                  : String(Date.now());
            const content =
              typeof msg?.message === "string"
                ? msg.message
                : typeof msg?.message !== "undefined"
                  ? JSON.stringify(msg.message)
                  : "";
            const role =
              msg?.role === "assistant" || msg?.role === "user"
                ? msg.role
                : "user";
            const ts =
              typeof msg?.timestamp === "string" ||
              msg?.timestamp instanceof Date
                ? new Date(msg.timestamp)
                : new Date();

            return { id, content, role, timestamp: ts };
          }
        );

        // Apply in one pass; only touch the one chat we fetched
        setLocalChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, messages } : c))
        );
      } catch (err) {
        console.error(
          `[AI_ASSISTANT] Failed to load chat history for ${chatId}:`,
          err
        );
      }
    },
    [getChatHistory]
  );

  useEffect(() => {
    if (!activeChatId) return;

    if (loadedHistoryIdsRef.current.has(activeChatId)) return;

    const localCurrent = localChats.find((c) => c.id === activeChatId);
    const hasMsgs =
      !!localCurrent &&
      Array.isArray(localCurrent.messages) &&
      localCurrent.messages.length > 0;

    if (!hasMsgs) {
      loadedHistoryIdsRef.current.add(activeChatId);
      void loadChatHistory(activeChatId);
    }
  }, [activeChatId, localChats, loadChatHistory]);

  // ---------- Send message ----------
  const sendMessage = useCallback(async () => {
    if (!message.trim()) {
      console.warn(`[AI_ASSISTANT] Send message aborted: empty message`);
      return;
    }
    const currentActive = localChats.find((c) => c.id === activeChatId);
    if (!currentActive) {
      console.warn(`[AI_ASSISTANT] Send message aborted: no active chat`, {
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

    // Optimistic append
    setLocalChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...(c.messages as ChatMessage[]), newMessage] }
          : c
      )
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

      setLocalChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...(c.messages as ChatMessage[]), aiResponse] }
            : c
        )
      );
    } catch (error) {
      console.error(`[AI_ASSISTANT] Network error sending message:`, error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setLocalChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [...(c.messages as ChatMessage[]), errorMessage],
              }
            : c
        )
      );
    } finally {
      setIsTyping(false);
    }
  }, [activeChatId, contextSendMessage, localChats, message]);

  const formatTime = (date: Date) => {
    const d =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ---------- JSX ----------
  return (
    <div className="mx-auto mt-8 h-[calc(100vh-10rem)] max-w-7xl md:mt-0">
      <div className="relative flex h-full overflow-hidden rounded-xl shadow-lg">
        {/* Sidebar (Chat list) */}
        <aside
          className={`${
            isSidebarExpanded
              ? "flex translate-x-0"
              : "hidden -translate-x-full"
          } flex-col transition-transform duration-300 ease-in-out xl:flex xl:w-80 xl:translate-x-0`}
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
                  className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition hover:bg-beige/10 xl:hidden"
                  aria-label="Collapse chat list"
                  aria-expanded={isSidebarExpanded}
                >
                  <ChevronLeft className="h-4 w-4 text-black" />
                </button>
              )}
            </div>
            <p className="text-sm text-black/60">
              Generate a report to be able to ask questions about your future
              home
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
              localChats
                .filter((chat: Chat) => {
                  const address = (chat?.propertyAddress ?? "").toString();
                  // Exclude filenames/addresses that look like comparison outputs
                  return (
                    !/[_-]vs[_-]/i.test(address) && !/\svs\s/i.test(address)
                  );
                })
                .map((chat: Chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setIsSidebarExpanded(false);
                    }}
                    className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${
                      activeChatId === chat.id ? "bg-beige/20" : ""
                    } `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 truncate text-sm font-medium text-black">
                          {chat.title}
                        </h3>
                        {Array.isArray(chat.messages) &&
                          (chat.messages as ChatMessage[]).length > 0 && (
                            <p className="truncate text-xs text-black/50">
                              {(() => {
                                const last = (chat.messages as ChatMessage[])[
                                  (chat.messages as ChatMessage[]).length - 1
                                ];
                                return last?.content ?? "";
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

        {/* Main Chat Section */}
        <section
          className={`relative flex flex-1 flex-col rounded-r-xl bg-white transition-all duration-300 ease-in-out ${
            isSidebarExpanded ? "hidden xl:flex" : "flex"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Chat Header (title + mobile menu button in the same line) */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-beige bg-white p-3">
              <div className="flex items-center gap-2">
                {/* MOBILE/TABLET MENU/BACK BUTTON */}
                <button
                  onClick={() => setIsSidebarExpanded((v) => !v)}
                  className="inline-flex items-center justify-center rounded-lg p-2 focus:outline-none xl:hidden"
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

                <h3
                  className={`text-sm font-medium text-black transition-opacity duration-300 ease-in-out ${isSidebarExpanded ? "opacity-0" : "opacity-100"}`}
                >
                  {activeChat
                    ? (activeChat.title ?? "AI Assistant")
                    : "AI Assistant"}
                </h3>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
              <div className="scrollbar-hide h-full space-y-3 overflow-y-auto p-3">
                {!activeChat ? (
                  <div className="flex h-full items-center justify-center">
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
                ) : (activeChat.messages as ChatMessage[]).length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
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
                  </div>
                ) : (
                  <>
                    {(activeChat.messages as ChatMessage[]).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-center gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                            className={`mt-2 text-xs ${msg.role === "user" ? "text-white/70" : "text-black/60"}`}
                          >
                            {formatTime(msg.timestamp)}
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
            </div>

            {/* Message Input - Fixed to bottom */}
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
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask about this property!"
                    className="scrollbar-hide w-full resize-none rounded-lg border border-beige px-3 py-2.5 text-sm transition-colors duration-150 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 md:py-3 md:text-base"
                    disabled={isTyping}
                    rows={1}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isTyping}
                  variant="primary"
                  className="flex-shrink-0 px-4 py-2.5 md:py-3"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
