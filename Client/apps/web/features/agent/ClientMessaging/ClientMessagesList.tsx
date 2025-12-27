import { Bot, MessageCircle, User as UserIcon, Search } from "lucide-react";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import SharedHomeCard from "../../../components/cards/SharedHomeCard";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
};

type ClientMessagesListProps = {
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ChatMessage[];
  isTyping: boolean;
  formatTime: (date: Date) => string;
  onSearchClick: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
};

export default function ClientMessagesList({
  canSendMessage,
  isLoadingHistory,
  localMessages,
  isTyping,
  formatTime,
  onSearchClick,
  messagesEndRef,
}: ClientMessagesListProps) {
  if (!canSendMessage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-3 h-16 w-16 text-black/40" />
          <h3 className="mb-2 text-lg font-medium text-black">
            No agent assigned
          </h3>
          <p className="mb-4 text-sm text-black/60">
            Search for an agent to start messaging
          </p>
          <button
            onClick={onSearchClick}
            className="mx-auto flex items-center justify-center gap-2 rounded-lg border border-beige/50 bg-white px-4 py-2 text-sm text-black/70 transition-colors hover:border-beige hover:bg-beige/5 hover:text-black"
          >
            <Search className="h-4 w-4" />
            Search for Agent
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center">
        <KeyTurnLoader message="Loading conversation..." />
      </div>
    );
  }

  if (localMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-beige/30">
            <MessageCircle className="h-8 w-8 text-black/40" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-black">
            Start a conversation
          </h3>
          <p className="mx-auto max-w-md text-sm text-black/60">
            Send a message to your agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {localMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-center gap-2 ${
            msg.role === "agent" ? "justify-start" : "justify-end"
          }`}
        >
          {msg.role === "agent" && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
              <Bot className="h-4 w-4 text-black" />
            </div>
          )}

          <div
            className={`max-w-lg rounded-xl px-4 py-3 ${
              msg.role === "agent"
                ? "bg-neutral-100 text-black"
                : "bg-olive text-white"
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
              <p className="whitespace-pre-line text-sm">{msg.content}</p>
            )}
            <p
              className={`mt-2 text-xs ${
                msg.role === "agent" ? "text-black/60" : "text-white/70"
              }`}
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

      {/* Typing indicator disabled - agent-client messaging should not show typing animations */}
      {/* {isTyping && (
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
      )} */}
      <div ref={messagesEndRef} />
    </>
  );
}
