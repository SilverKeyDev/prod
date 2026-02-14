import { chatbotApi } from "../../config/api";
import type { Chat } from "../../schemas";
import { formatFilenameToAddress } from "../../utils/search/address";

import { createAbortManager, isAbortError } from "../http";
import { log, LOG_CATEGORIES } from "../../../logger";

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
      // Check for shared reports data from ReportsContext first
      const windowWithSharedData = window as unknown as {
        sharedReportsData?: { timestamp: number; reports: unknown[] };
      };
      const sharedData = windowWithSharedData.sharedReportsData;
      const CACHE_TTL = 30000; // 30 seconds

      if (sharedData && Date.now() - sharedData.timestamp < CACHE_TTL) {
        log.debug(
          LOG_CATEGORIES.MESSAGES,
          "[CHAT_SERVICE] 📋 Using shared reports data from ReportsContext",
        );
        const { reports } = sharedData;

        const newChats: Chat[] = reports.map((report: unknown) => {
          if (!report || typeof report !== "object") {
            throw new Error("Invalid report data structure");
          }
          const reportData = report as Record<string, unknown>;
          return {
            id:
              typeof reportData.id === "string"
                ? reportData.id
                : typeof reportData.id === "number"
                  ? String(reportData.id)
                  : "unknown",
            title:
              typeof reportData.address === "string"
                ? formatFilenameToAddress(reportData.address)
                : `Report ${typeof reportData.id === "string" ? reportData.id : typeof reportData.id === "number" ? String(reportData.id) : "unknown"}`,
            propertyAddress:
              typeof reportData.address === "string" ? reportData.address : "",
            messages: [],
            createdAt: new Date(
              typeof reportData.generatedAt === "number"
                ? reportData.generatedAt * 1000
                : Date.now(),
            ),
          };
        });

        log.debug(
          LOG_CATEGORIES.MESSAGES,
          "[CHAT_SERVICE] ✅ Successfully processed chats from shared data:",
          {
            chatsCount: newChats.length,
            chatIds: newChats.map((c) => c.id),
          },
        );
        return newChats;
      }

      // Fallback: API endpoint removed - throw error if no shared data available
      log.debug(
        LOG_CATEGORIES.MESSAGES,
        "No shared data available and API endpoint removed",
      );
      throw new Error(
        "No shared reports data available and API endpoint removed",
      );
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "fetchChats error", {
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : undefined,
          stack:
            e &&
            typeof e === "object" &&
            "stack" in e &&
            typeof e.stack === "string"
              ? e.stack
              : undefined,
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
    log.debug(LOG_CATEGORIES.MESSAGES, "Starting sendMessage", {
      reportId,
      messageLength: message.length,
    });
    try {
      const cleanReportId =
        typeof reportId === "string"
          ? reportId.replace(/\.(pdf|json)$/, "")
          : String(reportId);
      log.debug(LOG_CATEGORIES.MESSAGES, "Calling chatbotApi.chatForAddress", {
        cleanReportId,
      });

      const response = await chatbotApi.chatForAddress(cleanReportId, message);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      log.info(LOG_CATEGORIES.MESSAGES, "sendMessage response", {
        hasResponse:
          response &&
          typeof response === "object" &&
          "response" in response &&
          typeof response.response === "string",
        messageId:
          response &&
          typeof response === "object" &&
          "message_id" in response &&
          typeof response.message_id === "string"
            ? response.message_id
            : undefined,
        messageSummary:
          response &&
          typeof response === "object" &&
          "message_summary" in response &&
          typeof response.message_summary === "string"
            ? response.message_summary
            : undefined,
      });

      return response;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "sendMessage error", {
        reportId,
        cleanReportId:
          typeof reportId === "string"
            ? reportId.replace(/\.(pdf|json)$/, "")
            : String(reportId),
        error,
        message:
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unknown error",
      });
      throw error;
    }
  }

  async getChatHistory(reportId: string): Promise<unknown> {
    log.debug(LOG_CATEGORIES.MESSAGES, "Starting getChatHistory", { reportId });
    try {
      const cleanReportId =
        typeof reportId === "string"
          ? reportId.replace(/\.(pdf|json)$/, "")
          : String(reportId);
      log.debug(LOG_CATEGORIES.MESSAGES, "Calling chatbotApi.getChatHistory", {
        cleanReportId,
      });

      const response = await chatbotApi.getChatHistory(cleanReportId);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const typedResponse = response as Record<string, unknown>;
      log.info(LOG_CATEGORIES.MESSAGES, "getChatHistory response", {
        messagesCount:
          "messages" in typedResponse && Array.isArray(typedResponse.messages)
            ? typedResponse.messages.length
            : 0,
        hasMessages:
          "messages" in typedResponse && Array.isArray(typedResponse.messages),
      });

      return response;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "getChatHistory error", {
        reportId,
        cleanReportId:
          typeof reportId === "string"
            ? reportId.replace(/\.(pdf|json)$/, "")
            : String(reportId),
        error,
        message:
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unknown error",
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
