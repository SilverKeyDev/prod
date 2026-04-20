import React from "react";

import type { EventRequestStatus } from "packages/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

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

export type MessagingEventRequestCardNativeProps = {
  messageId: string;
  payload: EventRequestPayload;
  eventRequestStatus: EventRequestStatus;
  isCurrentUserMessage: boolean;
  isAccepting: boolean;
  onAcceptEventRequest?: (messageId: string, payload: EventRequestPayload) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
};

export function MessagingEventRequestCardNative({
  messageId,
  payload,
  eventRequestStatus,
  isCurrentUserMessage,
  isAccepting,
  onAcceptEventRequest,
  onCancelEventRequest,
}: MessagingEventRequestCardNativeProps) {
  return (
    <Box className="mb-2">
      <Box className="border-border bg-background-surface rounded-lg border p-3">
        <Text className="text-text-primary font-medium">{payload.title}</Text>
        <Text className="text-text-secondary mt-1 text-sm">
          {formatEventDateTime(payload.start, payload.end)}
        </Text>
        {payload.location?.trim() ? (
          <Text className="text-text-secondary mt-1 text-sm" numberOfLines={2}>
            {payload.location.trim()}
          </Text>
        ) : null}
        {payload.description ? (
          <Text className="text-text-secondary mt-1 text-sm" numberOfLines={2}>
            {payload.description}
          </Text>
        ) : null}
        {eventRequestStatus === "pending" && !isCurrentUserMessage && (
          <Box className="mt-3 flex-row gap-2">
            <Pressable
              onPress={() => onAcceptEventRequest?.(messageId, payload)}
              disabled={isAccepting}
              className="bg-primary flex-1 items-center rounded-lg py-2"
            >
              <Text className="text-sm font-semibold text-white">Accept</Text>
            </Pressable>
            <Pressable
              onPress={() => onCancelEventRequest?.(messageId)}
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
  );
}
