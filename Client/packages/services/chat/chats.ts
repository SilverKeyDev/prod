import { log, LOG_CATEGORIES } from "logger";

import { chatbotApi } from "packages/config/api";
import type { Chat } from "packages/schemas";
import { createAbortManager, isAbortError } from "packages/services/http";
import { dateNow, dayjs } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";
import { formatFilenameToAddress } from "packages/utils/domain/search/address";

const CACHE_TTL = 30000; // 30 seconds

function reportToChat(report: unknown): Chat {
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
    propertyAddress:
      typeof reportData.address === "string" ? reportData.address : "",
    messages: [],
    createdAt: dayjs(
      typeof reportData.generatedAt === "number"
        ? reportData.generatedAt * 1000
        : dateNow().valueOf(),
    ).toDate(),
  };
}

function getSharedReportsData(): { reports: unknown[] } | null {
  const win = getWindow();
  const windowWithSharedData = win as unknown as {
    sharedReportsData?: { timestamp: number; reports: unknown[] };
  };
  const sharedData = win ? windowWithSharedData.sharedReportsData : undefined;
  if (!sharedData || Date.now() - sharedData.timestamp >= CACHE_TTL) {
    return null;
  }
  return { reports: sharedData.reports };
}

function getCleanReportId(reportId: string): string {
  return typeof reportId === "string"
    ? reportId.replace(/\.(pdf|json)$/, "")
    : String(reportId);
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Unknown error";
}

function getErrorLogPayload(e: unknown): { message?: string; stack?: string } {
  const msg =
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : undefined;
  const stack =
    e &&
    typeof e === "object" &&
    "stack" in e &&
    typeof (e as { stack: unknown }).stack === "string"
      ? (e as { stack: string }).stack
      : undefined;
  return { message: msg, stack };
}

/* =========================
   Chat Service
   ========================= */

export class ChatService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Chats
     ========================= */

  async fetchChats(): Promise<Chat[]> {
    log.debug(LOG_CATEGORIES.MESSAGES, "Starting fetchChats");

    try {
      const shared = getSharedReportsData();
      if (shared) {
        log.debug(
          LOG_CATEGORIES.MESSAGES,
          "[CHAT_SERVICE] 📋 Using shared reports data from ReportsContext",
        );
        const newChats: Chat[] = shared.reports.map((report) =>
          reportToChat(report),
        );
        log.debug(
          LOG_CATEGORIES.MESSAGES,
          "[CHAT_SERVICE] ✅ Successfully processed chats from shared data:",
          { chatsCount: newChats.length, chatIds: newChats.map((c) => c.id) },
        );
        return newChats;
      }

      log.debug(
        LOG_CATEGORIES.MESSAGES,
        "No shared data available and API endpoint removed",
      );
      throw new Error(
        "No shared reports data available and API endpoint removed",
      );
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        const payload = getErrorLogPayload(e);
        log.error(LOG_CATEGORIES.ERRORS, "fetchChats error", {
          error: e,
          message: payload.message,
          stack: payload.stack,
        });
        throw e;
      }
      throw e;
    } finally {
      log.debug(LOG_CATEGORIES.MESSAGES, "fetchChats completed");
    }
  }

  /* =========================
     Chatbot Methods
     ========================= */

  async sendMessage(reportId: string, message: string): Promise<unknown> {
    const cleanReportId = getCleanReportId(reportId);
    log.debug(LOG_CATEGORIES.MESSAGES, "Starting sendMessage", {
      reportId,
      messageLength: message.length,
    });
    try {
      log.debug(LOG_CATEGORIES.MESSAGES, "Calling chatbotApi.chatForAddress", {
        cleanReportId,
      });
      const response = await chatbotApi.chatForAddress(cleanReportId, message);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const res = response as Record<string, unknown>;
      log.info(LOG_CATEGORIES.MESSAGES, "sendMessage response", {
        hasResponse: typeof res.response === "string",
        messageId:
          typeof res.message_id === "string" ? res.message_id : undefined,
        messageSummary:
          typeof res.message_summary === "string"
            ? res.message_summary
            : undefined,
      });
      return response;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "sendMessage error", {
        reportId,
        cleanReportId,
        error,
        message: getErrorMessage(error),
      });
      throw error;
    }
  }

  async getChatHistory(reportId: string): Promise<unknown> {
    const cleanReportId = getCleanReportId(reportId);
    log.debug(LOG_CATEGORIES.MESSAGES, "Starting getChatHistory", {
      reportId,
    });
    try {
      log.debug(LOG_CATEGORIES.MESSAGES, "Calling chatbotApi.getChatHistory", {
        cleanReportId,
      });
      const response = await chatbotApi.getChatHistory(cleanReportId);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const typedResponse = response as Record<string, unknown>;
      log.info(LOG_CATEGORIES.MESSAGES, "getChatHistory response", {
        messagesCount: Array.isArray(typedResponse.messages)
          ? typedResponse.messages.length
          : 0,
        hasMessages: Array.isArray(typedResponse.messages),
      });
      return response;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "getChatHistory error", {
        reportId,
        cleanReportId,
        error,
        message: getErrorMessage(error),
      });
      throw error;
    }
  }

  /* =========================
     Abort Management
     ========================= */

  withAbort<T>(fn: () => Promise<T>): Promise<T> {
    return this.abortManager.withAbort(fn);
  }

  abortAll(): void {
    this.abortManager.abortAll();
  }
}

// Export singleton instance
export const chatService = new ChatService();
