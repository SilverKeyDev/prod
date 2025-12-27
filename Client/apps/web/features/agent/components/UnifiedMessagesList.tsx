import { MessageCircle, Search } from "lucide-react";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import SharedHomeCard from "../../../components/cards/SharedHomeCard";
import { getMessagingConfig, type MessagingMode } from "../config/messagingConfig";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
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
};

export default function UnifiedMessagesList({
  mode,
  canSendMessage,
  isLoadingHistory,
  localMessages,
  isTyping,
  formatTime,
  onSearchClick,
  messagesEndRef,
  selectedClientName,
}: UnifiedMessagesListProps) {
  const config = getMessagingConfig(mode);
  const MessageIcon = config.messageStyles.agent.icon;
  const UserIcon = config.messageStyles.user.icon;

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
      {localMessages.map((msg) => {
        const messageConfig =
          msg.role === "agent"
            ? config.messageStyles.agent
            : config.messageStyles.user;
        const Icon = messageConfig.icon;

        return (
          <div
            key={msg.id}
            className={`flex items-center gap-2 ${
              messageConfig.justify === "end" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "agent" && (
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.messageStyles.agent.iconBg}`}
              >
                <MessageIcon className="h-4 w-4 text-black" />
              </div>
            )}

            <div className={`max-w-lg rounded-xl px-4 py-3 ${messageConfig.bgColor}`}>
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
                  msg.role === "agent"
                    ? config.messageStyles.agent.textColor === "text-white"
                      ? "text-white/70"
                      : "text-black/60"
                    : config.messageStyles.user.textColor === "text-white"
                      ? "text-white/70"
                      : "text-black/60"
                }`}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>

            {msg.role === "user" && (
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.messageStyles.user.iconBg}`}
              >
                <UserIcon className="h-4 w-4 text-black" />
              </div>
            )}
          </div>
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

