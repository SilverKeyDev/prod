import React from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useDocumentsData } from "packages/features/documents";
import type {
  ChatMessage,
  EventRequestStatus,
} from "packages/features/messaging/hooks/data/messaging/types"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Shared message row; types live in messaging. */
import { parseEventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Shared message row; utils live in messaging. */
import { getDateDividerText } from "packages/features/messaging/utils/messageDateUtils"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Shared message row; utils live in messaging. */
import { useSavedHomesData } from "packages/features/search";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

type MessagingMessageRowNativeProps = {
  message: ChatMessage;
  previousMessage: ChatMessage | null;
  mode: "client" | "agent";
  formatTime: (date: Date) => string;
  /** When true, "Delivered" is shown for the latest user message (matches web ClientMessageRow). */
  isMostRecentMessage?: boolean;
  onRetryMessage?: (messageId: string) => void;
  onAcceptEventRequest?: (
    messageId: string,
    payload: { title: string; start: string; end: string; description?: string }
  ) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds?: Set<string>;
  acceptingEventRequestId?: string | null;
};

function formatEventDateTime(start: string, end: string): string {
  const startDate = dateParseISO(start).toDate();
  const endDate = dateParseISO(end).toDate();
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} – ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
  return `${dateStr} at ${timeStr}`;
}

export function MessagingMessageRowNative({
  message,
  previousMessage,
  mode,
  formatTime,
  isMostRecentMessage = false,
  onRetryMessage,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds = new Set(),
  acceptingEventRequestId = null,
}: MessagingMessageRowNativeProps) {
  const { getSavedHome } = useSavedHomesData();
  const { documents } = useDocumentsData();
  const currentUserRole = mode === "client" ? "user" : "agent";
  const isCurrentUserMessage = message.role === currentUserRole;
  const shouldShowDelivered =
    isCurrentUserMessage && message.status === "delivered" && isMostRecentMessage;
  const eventRequestPayload = parseEventRequestPayload(message.content);
  const showEventRequestCard =
    !!eventRequestPayload && !!(onAcceptEventRequest || onCancelEventRequest);
  const eventRequestStatus: EventRequestStatus =
    message.event_request_status ??
    (acceptedEventRequestIds.has(message.id) ? "accepted" : "pending");
  const isAccepting = message.id === acceptingEventRequestId;

  const dateDividerText = getDateDividerText(message.timestamp, previousMessage?.timestamp ?? null);

  return (
    <>
      {dateDividerText ? (
        <View style={styles.dateDividerWrap}>
          <View style={styles.dateDivider}>
            <Text className="text-text-secondary text-xs font-medium">{dateDividerText}</Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.row, isCurrentUserMessage ? styles.rowEnd : styles.rowStart]}>
        <View
          style={[styles.bubble, isCurrentUserMessage ? styles.bubbleUser : styles.bubbleAgent]}
        >
          {showEventRequestCard && eventRequestPayload && (
            <Box className="mb-2">
              <Box className="border-border bg-background-surface rounded-lg border p-3">
                <Text className="text-text-primary font-medium">{eventRequestPayload.title}</Text>
                <Text className="text-text-secondary mt-1 text-sm">
                  {formatEventDateTime(eventRequestPayload.start, eventRequestPayload.end)}
                </Text>
                {eventRequestPayload.description ? (
                  <Text className="text-text-secondary mt-1 text-sm" numberOfLines={2}>
                    {eventRequestPayload.description}
                  </Text>
                ) : null}
                {eventRequestStatus === "pending" && !isCurrentUserMessage && (
                  <Box className="mt-3 flex-row gap-2">
                    <Pressable
                      onPress={() => onAcceptEventRequest?.(message.id, eventRequestPayload)}
                      disabled={isAccepting}
                      className="bg-primary flex-1 items-center rounded-lg py-2"
                    >
                      <Text className="text-sm font-semibold text-white">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onCancelEventRequest?.(message.id)}
                      disabled={isAccepting}
                      className="border-border bg-background-base flex-1 items-center rounded-lg border py-2"
                    >
                      <Text className="text-text-primary text-sm font-semibold">Decline</Text>
                    </Pressable>
                  </Box>
                )}
                {eventRequestStatus === "accepted" && (
                  <Text className="text-accent mt-2 text-xs font-medium">Accepted</Text>
                )}
                {eventRequestStatus === "cancelled" && (
                  <Text className="text-text-secondary mt-2 text-xs font-medium">Cancelled</Text>
                )}
              </Box>
            </Box>
          )}
          {message.shared_home_id &&
            (() => {
              const savedHome = getSavedHome(message.shared_home_id);
              const address =
                savedHome?.address ??
                savedHome?.description ??
                message.content?.trim() ??
                message.shared_home_id;
              return (
                <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
                  <Text className="text-text-secondary text-xs font-medium">Shared home</Text>
                  <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
                    {address}
                  </Text>
                </Box>
              );
            })()}
          {message.shared_document_id &&
            (() => {
              const document = documents.find((d) => d.id === message.shared_document_id);
              const previewLabel = message.content?.trim();
              if (!document) {
                if (previewLabel) {
                  return (
                    <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
                      <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
                      <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
                        {previewLabel}
                      </Text>
                    </Box>
                  );
                }
                return (
                  <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
                    <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
                    <Text className="text-text-secondary mt-1 text-sm" numberOfLines={1}>
                      Document not found or has been deleted.
                    </Text>
                  </Box>
                );
              }
              return (
                <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
                  <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
                  <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
                    {document.address || document.filename || "Document"}
                  </Text>
                </Box>
              );
            })()}
          {!message.shared_home_id &&
          !message.shared_document_id &&
          !showEventRequestCard &&
          message.content.trim() ? (
            <Text className={isCurrentUserMessage ? "text-white" : "text-text-primary"} selectable>
              {message.content}
            </Text>
          ) : null}
          <Text
            className={
              isCurrentUserMessage
                ? "mt-1 text-xs text-white/80"
                : "text-text-secondary mt-1 text-xs"
            }
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
      {isCurrentUserMessage && message.status && (
        <View style={[styles.statusRow, isCurrentUserMessage ? styles.statusRowEnd : undefined]}>
          {message.status === "failed" && onRetryMessage && (
            <Pressable onPress={() => onRetryMessage(message.id)}>
              <Text className="text-xs font-medium text-red-500">Retry</Text>
            </Pressable>
          )}
          <Text
            className={`text-xs font-medium ${
              message.status === "failed" ? "text-red-500" : "text-text-secondary"
            }`}
          >
            {message.status === "sending"
              ? "Sending..."
              : shouldShowDelivered
                ? "Delivered"
                : message.status === "delivered"
                  ? ""
                  : message.status === "failed"
                    ? "Failed to send"
                    : ""}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateDividerWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dateDivider: {
    backgroundColor: color("neutral.100"),
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    maxWidth: "85%",
    marginVertical: 4,
  },
  rowEnd: {
    alignSelf: "flex-end",
  },
  rowStart: {
    alignSelf: "flex-start",
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: color("brand.accent"),
  },
  bubbleAgent: {
    backgroundColor: color("neutral.100"),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  statusRowEnd: {
    alignSelf: "flex-end",
  },
});
