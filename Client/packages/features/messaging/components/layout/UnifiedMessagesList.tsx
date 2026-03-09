import React from "react";

import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { EventRequestCard } from "packages/features/calendar";
import { useDocumentsData } from "packages/features/documents";
import SharedDocumentCard from "packages/features/messaging/components/cards/SharedDocumentCard";
import { useSavedHomesData } from "packages/features/search";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";

import HomeCard from "@/components/cards/HomeCard";
import { BodyText, Button, Title } from "@/components/ui";
import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messagingConfig";
import type {
  ChatMessage,
  EventRequestStatus,
} from "@/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";
import { parseEventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";
import { getDateDividerText } from "@/features/messaging/utils/messageDateUtils";
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
  activeConversation?: AgentConversation | null;
  onAcceptEventRequest?: (messageId: string, payload: EventRequestPayload) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds?: Set<string>;
  acceptingEventRequestId?: string | null;
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
  activeConversation,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds = new Set(),
  acceptingEventRequestId = null,
}: UnifiedMessagesListProps) {
  const { t } = useLocalization();
  const config = getMessagingConfig(mode);
  const { getSavedHome, isHomeSaved, saveHome, removeSavedHome } = useSavedHomesData();
  const { documents } = useDocumentsData();
  const homeCardSaveState =
    isHomeSaved && saveHome && removeSavedHome
      ? { isHomeSaved, saveHome, removeSavedHome }
      : undefined;
  if (!canSendMessage) {
    // In agent mode, when canSendMessage is false, just show the same empty state as no messages
    // In client mode, when canSendMessage is false, it means no agent is assigned
    if (mode === "agent") {
      // Show the same empty state as when there are no messages
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="bg-beige/30 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
              <Icon name="message-circle" className="h-8 w-8 text-black/40" />
            </div>
            <Title as="h3" size="lg" className="mb-2 font-medium text-black">
              {config.emptyStates.noMessages.title}
            </Title>
            <BodyText as="p" size="sm" className="mx-auto max-w-md text-black/60">
              {config.emptyStates.noMessages.message}
            </BodyText>
          </div>
        </div>
      );
    }
    // Client mode - show no agent assigned state
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Icon name="message-circle" className="mx-auto mb-3 h-16 w-16 text-black/40" />
          <Title as="h3" size="lg" className="mb-2 font-medium text-black">
            {config.emptyStates.noAgent.title}
          </Title>
          <BodyText as="p" size="sm" className="mb-4 text-black/60">
            {config.emptyStates.noAgent.message}
          </BodyText>
          {onSearchClick && (
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="search" className="h-4 w-4" />}
              iconPosition="left"
              onClick={onSearchClick}
              className="border-beige/50 hover:border-beige hover:bg-beige/5 mx-auto flex items-center justify-center gap-2 bg-white text-black/70 hover:text-black"
            >
              {config.emptyStates.noAgent.actionLabel}
            </Button>
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
          <div className="bg-beige/30 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
            <Icon name="message-circle" className="h-8 w-8 text-black/40" />
          </div>
          <Title as="h3" size="lg" className="mb-2 font-medium text-black">
            {config.emptyStates.noMessages.title}
          </Title>
          <BodyText as="p" size="sm" className="mx-auto max-w-md text-black/60">
            {mode === "agent" && selectedClientName
              ? config.emptyStates.noMessages.message.replace("your client", selectedClientName)
              : config.emptyStates.noMessages.message}
          </BodyText>
        </div>
      </div>
    );
  }
  return (
    <>
      {localMessages.map((msg, index) => {
        const messageConfig =
          msg.role === "agent" ? config.messageStyles.agent : config.messageStyles.user;
        const isMostRecentMessage = index === localMessages.length - 1;
        // Determine which role represents the current user based on mode
        const currentUserRole = mode === "client" ? "user" : "agent";
        const isCurrentUserMessage = msg.role === currentUserRole;
        const shouldShowDelivered =
          isCurrentUserMessage && msg.status === "delivered" && isMostRecentMessage;
        // Get previous message for date divider logic
        const previousMessage = index > 0 ? localMessages[index - 1] : null;
        const dateDividerText = getDateDividerText(
          msg.timestamp,
          previousMessage?.timestamp ?? null
        );
        const eventRequestPayload = parseEventRequestPayload(msg.content);
        const showEventRequestCard =
          eventRequestPayload &&
          activeConversation !== undefined &&
          (onAcceptEventRequest || onCancelEventRequest);
        const eventRequestStatus: EventRequestStatus =
          msg.event_request_status ??
          (acceptedEventRequestIds.has(msg.id) ? "accepted" : "pending");
        return (
          <React.Fragment key={msg.id}>
            {/* Date divider */}
            {dateDividerText && (
              <div className="flex items-center justify-center py-2">
                <div className="rounded-full bg-black/5 px-3 py-1">
                  <BodyText as="span" size="xs" className="font-medium text-black/60">
                    {dateDividerText}
                  </BodyText>
                </div>
              </div>
            )}
            <div
              className={`flex w-full min-w-0 max-w-full flex-col overflow-hidden ${messageConfig.justify === "end" ? "items-end" : "items-start"}`}
            >
              <div
                className={`min-w-0 max-w-[85%] overflow-hidden rounded-xl md:max-w-[60%] ${
                  msg.shared_home_id || msg.shared_document_id || showEventRequestCard
                    ? ""
                    : `px-4 py-3 ${messageConfig.bgColor}`
                }`}
              >
                {/* Show event request card if present */}
                {showEventRequestCard && eventRequestPayload && (
                  <div className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                    <EventRequestCard
                      payload={eventRequestPayload}
                      onAccept={() => onAcceptEventRequest?.(msg.id, eventRequestPayload)}
                      onCancel={() => onCancelEventRequest?.(msg.id)}
                      isFromCurrentUser={isCurrentUserMessage}
                      status={eventRequestStatus}
                      messageId={msg.id}
                      acceptingMessageId={acceptingEventRequestId}
                    />
                  </div>
                )}
                {/* Show shared home card if present */}
                {msg.shared_home_id &&
                  (() => {
                    const savedHome = getSavedHome(msg.shared_home_id);
                    const homeData = savedHome || {
                      home_id: msg.shared_home_id,
                      address: msg.content || undefined,
                    };
                    return (
                      <div className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                        <HomeCard home={homeData} saveState={homeCardSaveState} />
                      </div>
                    );
                  })()}
                {/* Show shared document card if present */}
                {msg.shared_document_id &&
                  (() => {
                    const document = documents.find((d) => d.id === msg.shared_document_id);
                    if (!document) {
                      return (
                        <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <BodyText as="p" size="sm" className="text-gray-500">
                            {t("agent.document_not_found")}
                          </BodyText>
                        </div>
                      );
                    }
                    return (
                      <div className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                        <SharedDocumentCard doc={document} />
                      </div>
                    );
                  })()}
                {/* Show message content only if there's no shared home, document, or event request card */}
                {!msg.shared_home_id &&
                  !msg.shared_document_id &&
                  !showEventRequestCard &&
                  msg.content.trim() && (
                    <BodyText as="p" size="sm" className="whitespace-pre-line">
                      {msg.content}
                    </BodyText>
                  )}
              </div>

              {/* Status text for current user's messages only - below the entire message row */}
              {isCurrentUserMessage && msg.status && (
                <div
                  className={`mt-1 flex w-full gap-1.5 ${messageConfig.justify === "end" ? "justify-end" : "justify-start"}`}
                >
                  {msg.status === "failed" && onRetryMessage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetryMessage(msg.id)}
                      className="text-xs font-medium text-red-500 underline hover:text-red-600"
                      label={t("agent.retry_sending_message")}
                    >
                      {t("agent.retry")}
                    </Button>
                  )}
                  <BodyText
                    as="span"
                    size="xs"
                    className={`font-medium ${msg.status === "failed" ? "text-red-500" : "text-black/60"}`}
                  >
                    {msg.status === "sending"
                      ? "Sending..."
                      : shouldShowDelivered
                        ? "Delivered"
                        : msg.status === "delivered"
                          ? ""
                          : "Failed to send"}
                  </BodyText>
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
