import { agentApi } from "../config/api/agent";
import type {
  AgentClient,
  AgentConversation,
  AgentChatMessage,
} from "../config/api/agent";

import { createAbortManager, isAbortError } from "./http";

/* =========================
   Agent Service
   ========================= */

export class AgentService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Clients
     ========================= */

  async fetchClients(): Promise<AgentClient[]> {
    console.log("[AGENT_SERVICE] 🚀 Starting fetchClients");

    try {
      const response = await agentApi.getClients();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch clients");
      }

      const clients = response.clients ?? [];
      console.log("[AGENT_SERVICE] ✅ fetchClients success:", {
        clientsCount: clients.length,
      });
      return clients;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ fetchClients error:", {
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : undefined,
        });
        throw e;
      }
      throw e;
    } finally {
      console.log("[AGENT_SERVICE] 🏁 fetchClients completed");
    }
  }

  /* =========================
     Fetch Conversations
     ========================= */

  async fetchChats(clientId?: string): Promise<AgentConversation[]> {

    try {
      const response = await agentApi.getChats(clientId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch conversations");
      }

      const conversations = response.conversations ?? [];
      console.log("[AGENT_SERVICE] ✅ fetchChats success:", {
        conversationsCount: conversations.length,
      });
      return conversations;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ fetchChats error:", {
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : undefined,
        });
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Get Chat History
     ========================= */

  async getChatHistory(
    conversationId: string
  ): Promise<{ messages: AgentChatMessage[]; conversation?: AgentConversation }> {
    console.log("[AGENT_SERVICE] 📜 Starting getChatHistory", { conversationId });

    try {
      const response = await agentApi.getChatHistory(conversationId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch chat history");
      }

      const messages = response.messages ?? [];
      console.log("[AGENT_SERVICE] ✅ getChatHistory success:", {
        messagesCount: messages.length,
      });

      return {
        messages,
        conversation: response.conversation,
      };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ getChatHistory error:", {
          conversationId,
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : "Unknown error",
        });
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Send Message
     ========================= */

  async sendMessage(
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string
  ): Promise<{ message_id: string }> {
    console.log("[AGENT_SERVICE] 💬 Starting sendMessage", {
      conversationId,
      messageLength: message.length,
      clientId,
      sharedHomeId,
    });

    try {
      const response = await agentApi.sendMessage(conversationId, message, clientId, sharedHomeId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to send message");
      }

      const messageId = response.message_id ?? String(Date.now());
      console.log("[AGENT_SERVICE] ✅ sendMessage success:", {
        messageId,
      });

      return { message_id: messageId };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ sendMessage error:", {
          conversationId,
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : "Unknown error",
        });
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Mark Messages as Read
     ========================= */

  async markMessagesAsRead(conversationId: string): Promise<{ marked_count: number }> {
    console.log("[AGENT_SERVICE] ✅ Starting markMessagesAsRead", { conversationId });

    try {
      const response = await agentApi.markMessagesAsRead(conversationId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to mark messages as read");
      }

      const markedCount = response.marked_count ?? 0;
      console.log("[AGENT_SERVICE] ✅ markMessagesAsRead success:", {
        markedCount,
      });

      return { marked_count: markedCount };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ markMessagesAsRead error:", {
          conversationId,
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : "Unknown error",
        });
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Create Conversation
     ========================= */

  async createConversation(clientId: string): Promise<AgentConversation> {
    console.log("[AGENT_SERVICE] 🆕 Starting createConversation", { clientId });

    try {
      const response = await agentApi.createConversation(clientId);
      if (!response.success || !response.conversation) {
        throw new Error(response.error ?? "Failed to create conversation");
      }

      console.log("[AGENT_SERVICE] ✅ createConversation success:", {
        conversationId: response.conversation.id,
      });

      return response.conversation;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("[AGENT_SERVICE] ❌ createConversation error:", {
          clientId,
          error: e,
          message:
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof e.message === "string"
              ? e.message
              : "Unknown error",
        });
        throw e;
      }
      throw e;
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
export const agentService = new AgentService();
