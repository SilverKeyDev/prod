/**
 * Pure helpers for messaging: map API messages to ChatMessage, format time
 */

import { dateNow, dateParseISO, dayjs } from "packages/utils/core/date";

import type { ApiMessageForMapping, ChatMessage } from "./types";

/**
 * Map API message shape to ChatMessage (framework-agnostic)
 */
export function mapApiMessagesToChatMessages(
  apiMessages: ApiMessageForMapping[],
): ChatMessage[] {
  return apiMessages.map((msg) => ({
    id: msg.id,
    content: msg.message,
    role: msg.role === "agent" ? "agent" : "user",
    timestamp:
      typeof msg.timestamp === "string"
        ? dateParseISO(msg.timestamp).toDate()
        : dayjs(msg.timestamp).toDate(),
    shared_home_id: msg.shared_home_id ?? null,
    shared_document_id: msg.shared_document_id ?? null,
    is_read: msg.is_read ?? false,
    read_at: msg.read_at ?? null,
    status: "delivered" as const,
    event_request_status: msg.event_request_status ?? null,
  }));
}

/**
 * Format a date for message display (within 24h = time, else date)
 */
export function formatMessageTime(date: Date): string {
  const d =
    date instanceof Date && !isNaN(date.getTime()) ? dayjs(date) : dateNow();
  const now = dateNow();
  const diffInMs = now.valueOf() - d.valueOf();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours > 24) {
    const isThisYear = d.year() === now.year();
    if (isThisYear) {
      return d.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return d.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return d.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
