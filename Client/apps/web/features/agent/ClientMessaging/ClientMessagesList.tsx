import React from "react";
import { MessageCircle, Search, Check, CheckCheck } from "lucide-react";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import SharedHomeCard from "../../../components/cards/SharedHomeCard";
import {
  getDateDividerText,
  shouldShowMessageTimestamp,
} from "../utils/messageDateUtils";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  status?: "sending" | "delivered" | "failed";
};

type ClientMessagesListProps = {
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ChatMessage[];
  isTyping: boolean;
  formatTime: (date: Date) => string;
  onSearchClick: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onRetryMessage?: (messageId: string) => void;
};

export default function ClientMessagesList({
  canSendMessage,
  isLoadingHistory,
  localMessages,
  isTyping,
  formatTime,
  onSearchClick,
  messagesEndRef,
  onRetryMessage,
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
      {localMessages.map((msg, index) => {
        const isMostRecentMessage = index === localMessages.length - 1;
        // In client mode, the current user sends messages with role "user"
        const isCurrentUserMessage = msg.role === "user";
        const shouldShowDelivered =
          isCurrentUserMessage &&
          msg.status === "delivered" &&
          isMostRecentMessage;

        // Get previous message for date divider logic
        const previousMessage =
          index > 0 ? localMessages[index - 1] : null;
        const dateDividerText = getDateDividerText(
          msg.timestamp,
          previousMessage?.timestamp ?? null,
        );

        // Determine if timestamp should be shown for this message
        const showTimestamp = shouldShowMessageTimestamp(
          msg.timestamp,
          msg.role,
          previousMessage?.timestamp ?? null,
          previousMessage?.role ?? null,
        );

        return (
          <React.Fragment key={msg.id}>
            {/* Date divider */}
            {dateDividerText && (
              <div className="flex items-center justify-center py-2">
                <div className="rounded-full bg-black/5 px-3 py-1">
                  <span className="text-xs font-medium text-black/60">
                    {dateDividerText}
                  </span>
                </div>
              </div>
            )}
            <div
              className={`flex flex-col ${
                msg.role === "agent" ? "items-start" : "items-end"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  msg.role === "agent" ? "justify-start" : "justify-end"
                }`}
              >
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
            </div>
          </div>
              </div>

              {/* Status text for current user's messages only - below the entire message row */}
              {isCurrentUserMessage && msg.status && (
                <div className="mt-1 flex items-center justify-end gap-1.5 pr-10">
                  {msg.status === "failed" && onRetryMessage && (
                    <button
                      onClick={() => onRetryMessage(msg.id)}
                      className="text-xs font-medium text-red-400 underline hover:text-red-300"
                      aria-label="Retry sending message"
                    >
                      Retry
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      msg.status === "failed" ? "text-red-400" : "text-black/60"
                    }`}
                  >
                    {msg.status === "sending"
                      ? "Sending..."
                      : shouldShowDelivered
                        ? "Delivered"
                        : msg.status === "delivered"
                          ? ""
                          : "Failed to send"}
                  </span>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

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
