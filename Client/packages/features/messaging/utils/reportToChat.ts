/**
 * Pure helpers: map report data to chat list shape and read shared reports from window (TTL).
 * Used by useChats so report→chat logic lives in one place.
 */

import type { Chat } from "packages/features/messaging/types/chat";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateNow, dayjs } from "packages/utils/date";
import { formatFilenameToAddress } from "packages/utils/format/address";
import { getWindow } from "packages/utils/platform";

const CACHE_TTL_MS = 30000; // 30 seconds

/** Chat list item shape (matches useChats and reportApi.list mapping). */
type ChatListItem = Chat;

/**
 * Map a single report (unknown) to the chat/list item shape.
 * @throws Error if report is invalid
 */
export function reportToChat(report: unknown): ChatListItem {
  if (!report || typeof report !== "object") {
    throw new Error("Invalid report data structure");
  }
  const reportData = report as Record<string, unknown>;
  const id =
    typeof reportData.id === "string"
      ? reportData.id
      : typeof reportData.id === "number"
        ? String(reportData.id)
        : "unknown";
  const title =
    typeof reportData.address === "string"
      ? formatFilenameToAddress(reportData.address)
      : `Report ${id}`;
  return {
    id,
    title,
    propertyAddress: typeof reportData.address === "string" ? reportData.address : "",
    messages: [],
    createdAt: dayjs(
      typeof reportData.generatedAt === "number"
        ? reportData.generatedAt * 1000
        : dateNow().valueOf()
    ).toDate(),
  };
}

/** Shape of shared reports data on window (set by app/ReportsContext). */
type SharedReportsData = {
  timestamp: number;
  reports: unknown[];
};

/**
 * Get shared reports from window if available and within TTL.
 * Returns null if no window, no data, or data is stale.
 */
export function getSharedReportsData(): { reports: unknown[] } | null {
  const win = getWindow();
  const windowWithSharedData = win as unknown as {
    sharedReportsData?: SharedReportsData;
  };
  const sharedData = win ? windowWithSharedData.sharedReportsData : undefined;
  if (!sharedData || Date.now() - sharedData.timestamp >= CACHE_TTL_MS) {
    return null;
  }
  return { reports: sharedData.reports };
}

/**
 * Get chats from shared reports data if available and within TTL.
 * Returns null if shared data is not available or stale.
 */
export function getChatsFromSharedData(): ChatListItem[] | null {
  const shared = getSharedReportsData();
  if (!shared) return null;
  log.debug(
    LOG_CATEGORIES.MESSAGES,
    "[reportToChat] Using shared reports data from ReportsContext"
  );
  const chats = shared.reports.map((report) => reportToChat(report));
  log.debug(LOG_CATEGORIES.MESSAGES, "[reportToChat] Processed chats from shared data", {
    chatsCount: chats.length,
    chatIds: chats.map((c) => c.id),
  });
  return chats;
}
