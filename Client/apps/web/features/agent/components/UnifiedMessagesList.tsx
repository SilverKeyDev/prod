import React from "react";
import { MessageCircle, Search } from "lucide-react";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import SharedHomeCard from "../../../components/cards/SharedHomeCard";
import {
  getMessagingConfig,
  type MessagingMode,
} from "../config/messagingConfig";
import { getDateDividerText } from "../utils/messageDateUtils";

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

type UnifiedMessagesListProps = {
  mode: MessagingMode;
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ChatMessage[];
  isTyping: boolean;
  formatTime: (date: Date) => string;
  onSearchClick?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  selectedClientName?: string;
  onRetryMessage?: (messageId: string) => void;
};

export default function UnifiedMessagesList({
  mode,
  canSendMessage,
  isLoadingHistory,
  localMessages,
  onSearchClick,
  messagesEndRef,
  selectedClientName,
  onRetryMessage,
}: UnifiedMessagesListProps) {
  const config = getMessagingConfig(mode);

  if (!canSendMessage) {
    // In agent mode, when canSendMessage is false, just show the same empty state as no messages
    // In client mode, when canSendMessage is false, it means no agent is assigned
    if (mode === "agent") {
      // Show the same empty state as when there are no messages
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-beige/30">
              <MessageCircle className="h-8 w-8 text-black/40" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-black">
              {config.emptyStates.noMessages.title}
            </h3>
            <p className="mx-auto max-w-md text-sm text-black/60">
              {config.emptyStates.noMessages.message}
            </p>
          </div>
        </div>
      );
    }

    // Client mode - show no agent assigned state
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-3 h-16 w-16 text-black/40" />
          <h3 className="mb-2 text-lg font-medium text-black">
            {config.emptyStates.noAgent.title}
          </h3>
          <p className="mb-4 text-sm text-black/60">
            {config.emptyStates.noAgent.message}
          </p>
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="mx-auto flex items-center justify-center gap-2 rounded-lg border border-beige/50 bg-white px-4 py-2 text-sm text-black/70 transition-colors hover:border-beige hover:bg-beige/5 hover:text-black"
            >
              <Search className="h-4 w-4" />
              {config.emptyStates.noAgent.actionLabel}
            </button>
          )}
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
            {config.emptyStates.noMessages.title}
          </h3>
          <p className="mx-auto max-w-md text-sm text-black/60">
            {mode === "agent" && selectedClientName
              ? config.emptyStates.noMessages.message.replace(
                  "your client",
                  selectedClientName
                )
              : config.emptyStates.noMessages.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {localMessages.map((msg, index) => {
        const messageConfig =
          msg.role === "agent"
            ? config.messageStyles.agent
            : config.messageStyles.user;
        const isMostRecentMessage = index === localMessages.length - 1;
        // Determine which role represents the current user based on mode
        const currentUserRole = mode === "client" ? "user" : "agent";
        const isCurrentUserMessage = msg.role === currentUserRole;
        const shouldShowDelivered =
          isCurrentUserMessage &&
          msg.status === "delivered" &&
          isMostRecentMessage;

        // Get previous message for date divider logic
        const previousMessage = index > 0 ? localMessages[index - 1] : null;
        const dateDividerText = getDateDividerText(
          msg.timestamp,
          previousMessage?.timestamp ?? null
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
                messageConfig.justify === "end" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  messageConfig.justify === "end"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-lg rounded-xl px-4 py-3 ${messageConfig.bgColor}`}
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

              {/* Status text for current user's messages only - below the entire message row */}
              {isCurrentUserMessage && msg.status && (
                <div className="mt-1 flex items-center justify-end gap-1.5 pr-10">
                  {msg.status === "failed" && onRetryMessage && (
                    <button
                      onClick={() => onRetryMessage(msg.id)}
                      className="text-xs font-medium text-red-500 underline hover:text-red-600"
                      aria-label="Retry sending message"
                    >
                      Retry
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      msg.status === "failed" ? "text-red-500" : "text-black/60"
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

      {/* Typing indicator disabled - this is agent messaging, not chatbot */}
      {/* Never show typing indicator in agent-client messaging - explicitly disabled for both agent and client modes */}
      {/* {mode === "agent" ? null : isTyping && (
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.typingIndicator.iconBg}`}
          >
            <MessageIcon className="h-4 w-4 text-black" />
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
