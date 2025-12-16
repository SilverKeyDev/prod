import { chatbotApi } from "../config/api/chatbot";
import { reportApi } from "../config/api/report";
import type { Chat } from "../schemas";
import { formatFilenameToAddress } from "../utils/address";

import { createAbortManager, isAbortError } from "./http";

/* =========================
   Chat Service
   ========================= */

export class ChatService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Chats
     ========================= */

  async fetchChats(): Promise<Chat[]> {
    console.log("[CHAT_SERVICE] 🚀 Starting fetchChats");

    try {
      // Check for shared reports data from ReportsContext first
      const windowWithSharedData = window as unknown as {
        sharedReportsData?: { timestamp: number; reports: unknown[] };
      };
      const sharedData = windowWithSharedData.sharedReportsData;
      const CACHE_TTL = 30000; // 30 seconds

      if (sharedData && Date.now() - sharedData.timestamp < CACHE_TTL) {
        console.log(
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

        console.log(
          "[CHAT_SERVICE] ✅ Successfully processed chats from shared data:",
          {
            chatsCount: newChats.length,
            chatIds: newChats.map((c) => c.id),
          },
        );
        return newChats;
      }

      // Fallback: API endpoint removed - throw error if no shared data available
      console.log(
        "[CHAT_SERVICE] ❌ No shared data available and API endpoint removed",
      );
      throw new Error("No shared reports data available and API endpoint removed");
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[CHAT_SERVICE] ❌ fetchChats error:", {
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
      console.log("[CHAT_SERVICE] 🏁 fetchChats completed");
    }
  }

  /* =========================
     Chatbot Methods
     ========================= */

  async sendMessage(reportId: string, message: string): Promise<unknown> {
    console.log("[CHAT_SERVICE] 💬 Starting sendMessage", {
      reportId,
      messageLength: message.length,
    });
    try {
      const cleanReportId =
        typeof reportId === "string"
          ? reportId.replace(/\.(pdf|json)$/, "")
          : String(reportId);
      console.log("[CHAT_SERVICE] 📡 Calling chatbotApi.chatForAddress", {
        cleanReportId,
      });

      const response = await chatbotApi.chatForAddress(cleanReportId, message);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      console.log("[CHAT_SERVICE] ✅ sendMessage response:", {
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
      console.error("[CHAT_SERVICE] ❌ sendMessage error:", {
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
    console.log("[CHAT_SERVICE] 📜 Starting getChatHistory", { reportId });
    try {
      const cleanReportId =
        typeof reportId === "string"
          ? reportId.replace(/\.(pdf|json)$/, "")
          : String(reportId);
      console.log("[CHAT_SERVICE] 📡 Calling chatbotApi.getChatHistory", {
        cleanReportId,
      });

      const response = await chatbotApi.getChatHistory(cleanReportId);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const typedResponse = response as Record<string, unknown>;
      console.log("[CHAT_SERVICE] ✅ getChatHistory response:", {
        messagesCount:
          "messages" in typedResponse && Array.isArray(typedResponse.messages)
            ? typedResponse.messages.length
            : 0,
        hasMessages:
          "messages" in typedResponse && Array.isArray(typedResponse.messages),
      });

      return response;
    } catch (error: unknown) {
      console.error("[CHAT_SERVICE] ❌ getChatHistory error:", {
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
