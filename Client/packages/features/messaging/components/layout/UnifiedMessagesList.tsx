import React, { useCallback } from "react";

import { Icon } from "@ui/icons";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { EventRequestCard } from "packages/features/calendar";
import { useDocumentsData } from "packages/features/documents";
import AgreementEventCard from "packages/features/messaging/components/cards/AgreementEventCard";
import SharedDocumentCard from "packages/features/messaging/components/cards/SharedDocumentCard";
import { parseAgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import {
  type SearchResult,
  SearchResultListingCard,
  useSavedHomesData,
} from "packages/features/search";
import { useNavigation } from "packages/navigation";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";
import { buildPropertyUrl } from "packages/utils/property/slug";
import { homeDescriptionToSearchResult } from "packages/utils/search/homeDescriptionToSearchResult";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

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
import {
  mergeSharedDocumentForDisplay,
  mergeSharedHomeForDisplay,
  parseSharedAttachmentSnapshot,
} from "@/features/messaging/utils/sharedAttachmentSnapshot";

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
  onAcceptEventRequest?: (
    messageId: string,
    payload: EventRequestPayload,
  ) => Promise<void>;
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
  const { getSavedHome, isHomeSaved, saveHome, removeSavedHome } =
    useSavedHomesData();
  const { documents } = useDocumentsData();
  const { navigate, navigateToPath } = useNavigation();

  const openSharedHomeDetails = useCallback(
    (property: SearchResult) => {
      const zpid = property.zpid ?? property.id;
      const address =
        typeof property.address === "string"
          ? property.address
          : property.address && typeof property.address === "object"
            ? Object.values(property.address).filter(Boolean).join(" ")
            : "property";
      navigateToPath(buildPropertyUrl(zpid, address));
    },
    [navigateToPath],
  );

  const _handleGenerateReport = (address: string) => {
    getLocalStorage().setItem(
      "generateReportState",
      JSON.stringify({
        address,
        reportType: "detailed",
        selectedClientId: "",
      }),
    );
    void navigate("SAVED");
  };
  if (!canSendMessage) {
    // In agent mode, when canSendMessage is false, just show the same empty state as no messages
    // In client mode, when canSendMessage is false, it means no agent is assigned
    if (mode === "agent") {
      // Show the same empty state as when there are no messages
      return (
        <Box className="flex h-full items-center justify-center">
          <Box className="text-center">
            <Box className="bg-accent-muted mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
              <Icon
                name="message-circle"
                className="text-text-secondary h-8 w-8"
              />
            </Box>
            <Title
              as="h3"
              size="lg"
              className="text-text-primary mb-2 font-medium"
            >
              {config.emptyStates.noMessages.title}
            </Title>
            <BodyText
              as="p"
              size="sm"
              className="text-text-secondary mx-auto max-w-md"
            >
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
          <Icon
            name="message-circle"
            className="text-text-secondary mx-auto mb-3 h-16 w-16"
          />
          <Title
            as="h3"
            size="lg"
            className="text-text-primary mb-2 font-medium"
          >
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
              className="border-border hover:bg-accent-muted bg-background-surface text-text-secondary hover:text-text-primary mx-auto flex items-center justify-center gap-2 hover:border-neutral-400"
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
            <Icon
              name="message-circle"
              className="text-text-secondary h-8 w-8"
            />
          </Box>
          <Title
            as="h3"
            size="lg"
            className="text-text-primary mb-2 font-medium"
          >
            {config.emptyStates.noMessages.title}
          </Title>
          <BodyText
            as="p"
            size="sm"
            className="text-text-secondary mx-auto max-w-md"
          >
            {mode === "agent" && selectedClientName
              ? config.emptyStates.noMessages.message.replace(
                  "your client",
                  selectedClientName,
                )
              : config.emptyStates.noMessages.message}
          </BodyText>
        </Box>
      </Box>
    );
  }
  // TODO: Add virtualization for very long message threads (>100 messages)
  // Use Virtuoso from packages/ui/components/adapters/virtuoso for better performance
  // Current implementation works well for typical conversation sizes
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
          previousMessage?.timestamp ?? null,
        );
        const eventRequestPayload = parseEventRequestPayload(msg.content);
        const showEventRequestCard =
          eventRequestPayload &&
          activeConversation !== undefined &&
          (onAcceptEventRequest || onCancelEventRequest);
        const agreementEventPayload = parseAgreementEventPayload(msg.content);
        const showAgreementEventCard = !!agreementEventPayload;
        const eventRequestStatus: EventRequestStatus =
          msg.event_request_status ??
          (acceptedEventRequestIds.has(msg.id) ? "accepted" : "pending");
        return (
          <React.Fragment key={msg.id}>
            {/* Date divider */}
            {dateDividerText && (
              <Box className="flex items-center justify-center py-2">
                <Box className="rounded-full bg-black/5 px-3 py-1">
                  <BodyText
                    as="span"
                    size="xs"
                    className="text-text-secondary font-medium"
                  >
                    {dateDividerText}
                  </BodyText>
                </Box>
              </Box>
            )}
            <Box
              className={`flex w-full min-w-0 max-w-full flex-col overflow-hidden ${
                messageConfig.justify === "end" ? "items-end" : "items-start"
              }`}
            >
              <Box
                className={`min-w-0 max-w-[85%] overflow-hidden rounded-xl md:max-w-[60%] ${
                  msg.shared_home_id ||
                  msg.shared_document_id ||
                  showEventRequestCard ||
                  showAgreementEventCard
                    ? ""
                    : `px-4 py-3 ${messageConfig.bgColor}`
                }`}
              >
                {/* Show event request card if present */}
                {showEventRequestCard && eventRequestPayload && (
                  <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                    <EventRequestCard
                      payload={eventRequestPayload}
                      onAccept={() =>
                        onAcceptEventRequest?.(msg.id, eventRequestPayload)
                      }
                      onCancel={() => onCancelEventRequest?.(msg.id)}
                      isFromCurrentUser={isCurrentUserMessage}
                      status={eventRequestStatus}
                      messageId={msg.id}
                      acceptingMessageId={acceptingEventRequestId}
                    />
                  </Box>
                )}
                {/* Show agreement event card if present */}
                {showAgreementEventCard && agreementEventPayload && (
                  <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
                    <AgreementEventCard
                      payload={agreementEventPayload}
                      isAgent={mode === "agent"}
                      onViewDocument={() =>
                        navigateToPath("/saved?view=agreements")
                      }
                      onSignNow={() => navigateToPath("/saved?view=agreements")}
                    />
                  </Box>
                )}
                {/* Show shared home card if present */}
                {msg.shared_home_id &&
                  (() => {
                    const homeData = mergeSharedHomeForDisplay(
                      msg.shared_home_id,
                      msg.content,
                      getSavedHome,
                    );
                    const searchProperty =
                      homeDescriptionToSearchResult(homeData);
                    return (
                      <Box
                        role="button"
                        tabIndex={0}
                        className="mb-2 w-full min-w-0 max-w-full cursor-pointer overflow-hidden"
                        onClick={() =>
                          void openSharedHomeDetails(searchProperty)
                        }
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void openSharedHomeDetails(searchProperty);
                          }
                        }}
                      >
                        <SearchResultListingCard
                          property={searchProperty}
                          activeTab="results"
                          isHomeSaved={isHomeSaved}
                          saveHome={saveHome}
                          removeSavedHome={removeSavedHome}
                          showNotInterested={false}
                          showMatchScore={true}
                        />
                      </Box>
                    );
                  })()}
                {/* Show shared document card if present */}
                {msg.shared_document_id &&
                  (() => {
                    const document = mergeSharedDocumentForDisplay(
                      msg.content,
                      msg.shared_document_id,
                      documents,
                    );
                    const snap = parseSharedAttachmentSnapshot(msg.content);
                    const previewLabel =
                      snap?.kind === "document"
                        ? snap.displayLine
                        : msg.content?.trim();
                    if (!document) {
                      if (previewLabel) {
                        return (
                          <Box className="border-border bg-primary-muted mb-2 rounded-lg border p-4">
                            <BodyText
                              as="p"
                              size="xs"
                              className="text-text-secondary font-medium"
                            >
                              {t("agent.share_document")}
                            </BodyText>
                            <BodyText
                              as="p"
                              size="sm"
                              className="text-text-primary mt-1"
                            >
                              {previewLabel}
                            </BodyText>
                          </Box>
                        );
                      }
                      return (
                        <Box className="border-border bg-primary-muted mb-2 rounded-lg border p-4">
                          <BodyText
                            as="p"
                            size="sm"
                            className="text-text-secondary"
                          >
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
                {/* Show message content only if there's no shared home, document, event request, or agreement event card */}
                {!msg.shared_home_id &&
                  !msg.shared_document_id &&
                  !showEventRequestCard &&
                  !showAgreementEventCard &&
                  msg.content.trim() && (
                    <BodyText
                      as="p"
                      size="sm"
                      className={`whitespace-pre-line ${messageConfig.textColor}`}
                    >
                      {msg.content}
                    </BodyText>
                  )}
              </Box>

              {/* Status text for current user's messages only - below the entire message row */}
              {isCurrentUserMessage && msg.status && (
                <Box
                  className={`mt-1 flex w-full gap-1.5 ${
                    messageConfig.justify === "end"
                      ? "justify-end"
                      : "justify-start"
                  }`}
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
                    className={`font-medium ${
                      msg.status === "failed"
                        ? "text-destructive"
                        : "text-text-secondary"
                    }`}
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
