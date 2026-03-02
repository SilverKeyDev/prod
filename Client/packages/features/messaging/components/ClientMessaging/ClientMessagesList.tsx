import React from "react";

import { type ClientChatMessage, ClientMessageRow } from "./ClientMessageRow";
import {
  EmptyConversationState,
  LoadingState,
  NoAgentState,
} from "./ClientMessagesListEmptyStates";

export type ClientMessagesListProps = {
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ClientChatMessage[];
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
  isTyping: _isTyping,
  formatTime: _formatTime,
  onSearchClick,
  messagesEndRef,
  onRetryMessage,
}: ClientMessagesListProps) {
  if (!canSendMessage) {
    return <NoAgentState onSearchClick={onSearchClick} />;
  }

  if (isLoadingHistory) {
    return <LoadingState />;
  }

  if (localMessages.length === 0) {
    return <EmptyConversationState />;
  }

  return (
    <>
      {localMessages.map((msg, index) => (
        <ClientMessageRow
          key={msg.id}
          msg={msg}
          index={index}
          totalCount={localMessages.length}
          previousTimestamp={index > 0 ? localMessages[index - 1].timestamp : null}
          onRetryMessage={onRetryMessage}
          messagesEndRef={messagesEndRef}
          isLast={index === localMessages.length - 1}
        />
      ))}
    </>
  );
}
