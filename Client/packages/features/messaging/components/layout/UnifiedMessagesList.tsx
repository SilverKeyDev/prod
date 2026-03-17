import React from "react";

import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { EventRequestCard } from "packages/features/calendar";
import { useDocumentsData } from "packages/features/documents";
import SharedDocumentCard from "packages/features/messaging/components/cards/SharedDocumentCard";
import { useSavedHomesData } from "packages/features/search";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";

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
        <Box className="flex h-full items-center justify-center">
          <Box className="text-center">
            <Box className="bg-accent-muted mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
              <Icon name="message-circle" className="text-text-secondary h-8 w-8" />
            </Box>
            <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
              {config.emptyStates.noMessages.title}
            </Title>
            <BodyText as="p" size="sm" className="text-text-secondary mx-auto max-w-md">
              {config.emptyStates.noMessages.message}
            </BodyText>
          </Box>
        </Box>
      );
    }
    // Client mode - show no agent assigned state
    return (
      <Box className="flex h-full items-center justify-center">
        <Box className="text-center">
          <Icon name="message-circle" className="text-text-secondary mx-auto mb-3 h-16 w-16" />
          <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
            {config.emptyStates.noAgent.title}
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary mb-4">
            {config.emptyStates.noAgent.message}
          </BodyText>
          {onSearchClick && (
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="search" className="h-4 w-4" />}
              iconPosition="left"
              onClick={onSearchClick}
              className="border-border hover:border-accent hover:bg-accent-muted bg-background-surface text-text-secondary hover:text-text-primary mx-auto flex items-center justify-center gap-2"
            >
              {config.emptyStates.noAgent.actionLabel}
            </Button>
          )}
        </Box>
      </Box>
    );
  }
  if (isLoadingHistory) {
    return (
      <Box className="flex h-full items-center justify-center">
        <KeyTurnLoader message="Loading conversation..." />
      </Box>
    );
  }
  if (localMessages.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Box className="text-center">
          <Box className="bg-accent-muted mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
            <Icon name="message-circle" className="text-text-secondary h-8 w-8" />
          </Box>
          <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
            {config.emptyStates.noMessages.title}
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary mx-auto max-w-md">
            {mode === "agent" && selectedClientName
              ? config.emptyStates.noMessages.message.replace("your client", selectedClientName)
              : config.emptyStates.noMessages.message}
          </BodyText>
        </Box>
      </Box>
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
              <Box className="flex items-center justify-center py-2">
                <Box className="rounded-full bg-black/5 px-3 py-1">
                  <BodyText as="span" size="xs" className="text-text-secondary font-medium">
                    {dateDividerText}
                  </BodyText>
                </Box>
              </Box>
            )}
            <Box
              className={`flex w-full min-w-0 max-w-full flex-col overflow-hidden ${messageConfig.justify === "end" ? "items-end" : "items-start"}`}
            >
              <Box
                className={`min-w-0 max-w-[85%] overflow-hidden rounded-xl md:max-w-[60%] ${
                  msg.shared_home_id || msg.shared_document_id || showEventRequestCard
                    ? ""
                    : `px-4 py-3 ${messageConfig.bgColor}`
                }`}
              >
                {/* Show event request card if present */}
                {showEventRequestCard && eventRequestPayload && (
                  <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                    <EventRequestCard
                      payload={eventRequestPayload}
                      onAccept={() => onAcceptEventRequest?.(msg.id, eventRequestPayload)}
                      onCancel={() => onCancelEventRequest?.(msg.id)}
                      isFromCurrentUser={isCurrentUserMessage}
                      status={eventRequestStatus}
                      messageId={msg.id}
                      acceptingMessageId={acceptingEventRequestId}
                    />
                  </Box>
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
                      <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                        <HomeCard home={homeData} saveState={homeCardSaveState} />
                      </Box>
                    );
                  })()}
                {/* Show shared document card if present */}
                {msg.shared_document_id &&
                  (() => {
                    const document = documents.find((d) => d.id === msg.shared_document_id);
                    if (!document) {
                      return (
                        <Box className="border-border bg-primary-muted mb-2 rounded-lg border p-4">
                          <BodyText as="p" size="sm" className="text-text-secondary">
                            {t("agent.document_not_found")}
                          </BodyText>
                        </Box>
                      );
                    }
                    return (
                      <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                        <SharedDocumentCard doc={document} />
                      </Box>
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
              </Box>

              {/* Status text for current user's messages only - below the entire message row */}
              {isCurrentUserMessage && msg.status && (
                <Box
                  className={`mt-1 flex w-full gap-1.5 ${messageConfig.justify === "end" ? "justify-end" : "justify-start"}`}
                >
                  {msg.status === "failed" && onRetryMessage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetryMessage(msg.id)}
                      className="text-destructive hover:text-destructive-hover text-xs font-medium underline"
                      label={t("agent.retry_sending_message")}
                    >
                      {t("agent.retry")}
                    </Button>
                  )}
                  <BodyText
                    as="span"
                    size="xs"
                    className={`font-medium ${msg.status === "failed" ? "text-destructive" : "text-text-secondary"}`}
                  >
                    {msg.status === "sending"
                      ? t("agent.sending")
                      : shouldShowDelivered
                        ? t("agent.delivered")
                        : msg.status === "delivered"
                          ? ""
                          : t("agent.failed_to_send")}
                  </BodyText>
                </Box>
              )}
            </Box>
          </React.Fragment>
        );
      })}

      {/* Typing indicator disabled - this is agent messaging, not chatbot */}
      {/* Never show typing indicator in agent-client messaging - explicitly disabled for both agent and client modes */}
      {/* {mode === "agent" ? null : isTyping && (
            <Box className="flex items-center gap-2">
              <Box
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.typingIndicator.iconBg}`}
              >
                <MessageIcon className="h-4 w-4 text-text-primary" />
              </Box>
              <Box className="rounded-xl border border-border bg-background-surface px-3 py-2">
                <Box className="flex gap-1">
                  <Box className="h-2 w-2 animate-bounce rounded-full bg-text-primary"></Box>
                  <Box
                    className="h-2 w-2 animate-bounce rounded-full bg-text-primary"
                    style={{ animationDelay: "0.1s" }}
                  ></Box>
                  <Box
                    className="h-2 w-2 animate-bounce rounded-full bg-text-primary"
                    style={{ animationDelay: "0.2s" }}
                  ></Box>
                </Box>
              </Box>
            </Box>
          )} */}
      <Box ref={messagesEndRef} />
    </>
  );
}
