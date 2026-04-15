import React from "react";

import type { AgentConversation } from "packages/api";
import { EventRequestCard } from "packages/features/calendar";
import type { DocumentData } from "packages/features/documents";
import AgreementEventCard from "packages/features/messaging/components/cards/AgreementEventCard";
import SharedDocumentCard from "packages/features/messaging/components/cards/SharedDocumentCard";
import { parseAgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import {
  type SearchResult,
  SearchResultListingCard,
} from "packages/features/search";
import type { SavedHome } from "packages/types";
import { Box } from "packages/ui/components/primitives";
import { homeDescriptionToSearchResult } from "packages/utils/search/homeDescriptionToSearchResult";

import { BodyText, Button } from "@/components/ui";
import type { MessagingMode } from "@/features/agent/components/messagingConfig";
import type { MessagingConfig } from "@/features/agent/components/messagingConfig";
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

export type UnifiedMessageThreadRowProps = {
  msg: ChatMessage;
  index: number;
  localMessages: ChatMessage[];
  mode: MessagingMode;
  config: MessagingConfig;
  activeConversation: AgentConversation | null | undefined;
  onAcceptEventRequest?: (
    messageId: string,
    payload: EventRequestPayload,
  ) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds: Set<string>;
  acceptingEventRequestId: string | null;
  viewerUserId: string | null;
  onAgreementView: (agreementId: string, documentName: string) => void;
  onAgreementSignNow: (agreementId: string) => void;
  getSavedHome: (propertyId: string) => SavedHome | undefined;
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: unknown) => Promise<unknown>;
  removeSavedHome: (
    propertyId: string,
    propertyAddress?: string,
  ) => Promise<unknown>;
  documents: DocumentData[];
  t: (key: string) => string;
  openSharedHomeDetails: (property: SearchResult) => void;
  onRetryMessage?: (messageId: string) => void;
};

export function UnifiedMessageThreadRow({
  msg,
  index,
  localMessages,
  mode,
  config,
  activeConversation,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds,
  acceptingEventRequestId,
  viewerUserId,
  onAgreementView,
  onAgreementSignNow,
  getSavedHome,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  documents,
  t,
  openSharedHomeDetails,
  onRetryMessage,
}: UnifiedMessageThreadRowProps) {
  const messageConfig =
    msg.role === "agent"
      ? config.messageStyles.agent
      : config.messageStyles.user;
  const isMostRecentMessage = index === localMessages.length - 1;
  const currentUserRole = mode === "client" ? "user" : "agent";
  const isCurrentUserMessage = msg.role === currentUserRole;
  const shouldShowDelivered =
    isCurrentUserMessage && msg.status === "delivered" && isMostRecentMessage;
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
    <>
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
          {showAgreementEventCard && agreementEventPayload && (
            <Box className="mb-2 w-full min-w-0 max-w-full overflow-hidden">
              <AgreementEventCard
                payload={agreementEventPayload}
                isAgent={mode === "agent"}
                viewerUserId={viewerUserId}
                onViewDocument={onAgreementView}
                onSignNow={onAgreementSignNow}
              />
            </Box>
          )}
          {msg.shared_home_id &&
            (() => {
              const homeData = mergeSharedHomeForDisplay(
                msg.shared_home_id,
                msg.content,
                getSavedHome,
              );
              const searchProperty = homeDescriptionToSearchResult(homeData);
              return (
                <Box
                  role="button"
                  tabIndex={0}
                  className="mb-2 w-full min-w-0 max-w-full cursor-pointer overflow-hidden"
                  onClick={() => void openSharedHomeDetails(searchProperty)}
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
          {msg.shared_document_id &&
            !showAgreementEventCard &&
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

        {isCurrentUserMessage && msg.status && (
          <Box
            className={`mt-1 flex w-full gap-1.5 ${
              messageConfig.justify === "end" ? "justify-end" : "justify-start"
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
    </>
  );
}
