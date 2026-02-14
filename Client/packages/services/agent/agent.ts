import { agentApi } from "../../config/api";
import type {
  AgentClient,
  AgentConversation,
  AgentChatMessage,
} from "../../config/api";
import type {
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
} from "../../config/api/agent/agent";

import { createAbortManager, isAbortError } from "../http";
import { log, LOG_CATEGORIES } from "../../../logger";

/* =========================
   Agent Service
   ========================= */

export class AgentService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Clients
     ========================= */

  async fetchClients(): Promise<AgentClient[]> {
    log.debug(LOG_CATEGORIES.API, "Starting fetchClients");

    try {
      const response = await agentApi.getClients();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch clients");
      }

      const clients = response.clients ?? [];
      log.info(LOG_CATEGORIES.API, "fetchClients success", {
        clientsCount: clients.length,
      });
      return clients;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "fetchClients error", {
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
      log.debug(LOG_CATEGORIES.API, "fetchClients completed");
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
      log.info(LOG_CATEGORIES.API, "fetchChats success", {
        conversationsCount: conversations.length,
      });
      return conversations;
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
    conversationId: string,
  ): Promise<{
    messages: AgentChatMessage[];
    conversation?: AgentConversation;
  }> {
    log.debug(LOG_CATEGORIES.API, "Starting getChatHistory", {
      conversationId,
    });

    try {
      const response = await agentApi.getChatHistory(conversationId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch chat history");
      }

      const messages = response.messages ?? [];
      log.info(LOG_CATEGORIES.API, "getChatHistory success", {
        messagesCount: messages.length,
      });

      return {
        messages,
        conversation: response.conversation,
      };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "getChatHistory error", {
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
    sharedHomeId?: string,
  ): Promise<{ message_id: string }> {
    log.debug(LOG_CATEGORIES.API, "Starting sendMessage", {
      conversationId,
      messageLength: message.length,
      clientId,
      sharedHomeId,
    });

    try {
      const response = await agentApi.sendMessage(
        conversationId,
        message,
        clientId,
        sharedHomeId,
      );
      if (!response.success) {
        throw new Error(response.error ?? "Failed to send message");
      }

      const messageId = response.message_id ?? String(Date.now());
      log.info(LOG_CATEGORIES.API, "sendMessage success", {
        messageId,
      });

      return { message_id: messageId };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "sendMessage error", {
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

  async markMessagesAsRead(
    conversationId: string,
  ): Promise<{ marked_count: number }> {
    log.debug(LOG_CATEGORIES.API, "Starting markMessagesAsRead", {
      conversationId,
    });

    try {
      const response = await agentApi.markMessagesAsRead(conversationId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to mark messages as read");
      }

      const markedCount = response.marked_count ?? 0;
      log.info(LOG_CATEGORIES.API, "markMessagesAsRead success", {
        markedCount,
      });

      return { marked_count: markedCount };
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "markMessagesAsRead error", {
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
    log.debug(LOG_CATEGORIES.API, "Starting createConversation", { clientId });

    try {
      const response = await agentApi.createConversation(clientId);
      if (!response.success || !response.conversation) {
        throw new Error(response.error ?? "Failed to create conversation");
      }

      log.info(LOG_CATEGORIES.API, "createConversation success", {
        conversationId: response.conversation.id,
      });

      return response.conversation;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "createConversation error", {
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
     Todo Management
     ========================= */

  async fetchTodos(includeCompleted: boolean = false): Promise<TodoItem[]> {
    log.debug(LOG_CATEGORIES.API, "Starting fetchTodos", { includeCompleted });

    try {
      const response = await agentApi.getTodos(includeCompleted);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch todos");
      }

      const todos = response.todos ?? [];
      log.info(LOG_CATEGORIES.API, "fetchTodos success", {
        todosCount: todos.length,
      });
      return todos;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "fetchTodos error", {
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

  async createTodo(data: CreateTodoRequest): Promise<TodoItem> {
    log.debug(LOG_CATEGORIES.API, "Starting createTodo", { title: data.title });

    try {
      const response = await agentApi.createTodo(data);
      if (!response.success || !response.todo) {
        throw new Error(response.error ?? "Failed to create todo");
      }

      log.info(LOG_CATEGORIES.API, "createTodo success", {
        todoId: response.todo.id,
      });

      return response.todo;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "createTodo error", {
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

  async updateTodo(todoId: string, data: UpdateTodoRequest): Promise<TodoItem> {
    log.debug(LOG_CATEGORIES.API, "Starting updateTodo", { todoId });

    try {
      const response = await agentApi.updateTodo(todoId, data);
      if (!response.success || !response.todo) {
        throw new Error(response.error ?? "Failed to update todo");
      }

      log.info(LOG_CATEGORIES.API, "updateTodo success", {
        todoId: response.todo.id,
      });

      return response.todo;
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "updateTodo error", {
          todoId,
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
