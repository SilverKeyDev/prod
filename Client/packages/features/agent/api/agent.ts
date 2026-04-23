/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPatch, apiPost, apiPut } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type AgentClient = components["schemas"]["AgentClient"];
export type AgentConversation = components["schemas"]["AgentConversation"];
export type EventRequestStatus = components["schemas"]["EventRequestStatus"];
export type AgentChatMessage = components["schemas"]["AgentChatMessage"];
export type AgentClientsResponse = components["schemas"]["AgentClientsResponse"];
export type AgentConversationsResponse = components["schemas"]["AgentConversationsResponse"];
export type AgentChatHistoryResponse = components["schemas"]["AgentChatHistoryResponse"];
export type SendMessageRequest = components["schemas"]["SendMessageRequest"];
export type SendMessageResponse = components["schemas"]["SendMessageResponse"];
export type CreateConversationRequest = components["schemas"]["CreateConversationRequest"];
export type CreateConversationResponse = components["schemas"]["CreateConversationResponse"];
export type AgentSearchResult = components["schemas"]["AgentSearchResult"];
export type ClientSearchResult = components["schemas"]["ClientSearchResult"];
export type AgentConnectionRequest = components["schemas"]["AgentConnectionRequest"];
export type SearchAgentsResponse = components["schemas"]["SearchAgentsResponse"];
export type RecommendedAgentsResponse = components["schemas"]["RecommendedAgentsResponse"];
export type RecommendedAgentResult = components["schemas"]["RecommendedAgentResult"];
export type SearchClientsResponse = components["schemas"]["SearchClientsResponse"];
export type ConnectionRequestsResponse = components["schemas"]["ConnectionRequestsResponse"];
export type CreateConnectionRequestRequest =
  components["schemas"]["CreateConnectionRequestRequest"];
export type CreateConnectionRequestResponse =
  components["schemas"]["CreateConnectionRequestResponse"];
export type RespondToConnectionRequestRequest =
  components["schemas"]["RespondToConnectionRequestRequest"];
export type RespondToConnectionRequestResponse =
  components["schemas"]["RespondToConnectionRequestResponse"];
export type MarkMessagesAsReadResponse = components["schemas"]["MarkMessagesAsReadResponse"];
export type NotificationCounterResponse = components["schemas"]["NotificationCounterResponse"];
export type TodoItem = components["schemas"]["TodoItem"];
export type GetTodosResponse = components["schemas"]["GetTodosResponse"];
export type CreateTodoRequest = components["schemas"]["CreateTodoRequest"];
export type CreateTodoResponse = components["schemas"]["CreateTodoResponse"];
export type UpdateTodoRequest = components["schemas"]["UpdateTodoRequest"];
export type UpdateTodoResponse = components["schemas"]["UpdateTodoResponse"];

/**
 * Agent API client using centralized utilities
 */
export const agentApi = {
  /**
   * Get list of clients for authenticated agent
   */
  getClients: (): Promise<AgentClientsResponse> =>
    apiGet<AgentClientsResponse>("/api/v1/agent/clients"),

  /**
   * Get list of conversations for authenticated user (agent or client)
   */
  getChats: (clientId?: string): Promise<AgentConversationsResponse> => {
    const params = clientId ? `?client_id=${encodeURIComponent(clientId)}` : "";
    return apiGet<AgentConversationsResponse>(`/api/v1/agent/chats${params}`);
  },

  /**
   * Get chat history for a specific conversation
   */
  getChatHistory: (conversationId: string): Promise<AgentChatHistoryResponse> =>
    apiGet<AgentChatHistoryResponse>(`/api/v1/agent/chats/${conversationId}/history`),

  /**
   * Send a message in a conversation
   */
  sendMessage: async (
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string,
    sharedDocumentId?: string
  ): Promise<SendMessageResponse> => {
    const requestBody = {
      conversation_id: conversationId,
      message,
      ...(clientId && { client_id: clientId }),
      ...(sharedHomeId && { shared_home_id: sharedHomeId }),
      ...(sharedDocumentId && { shared_document_id: sharedDocumentId }),
    };

    log.debug(LOG_CATEGORIES.API, "Sending message request", {
      endpoint: "/api/v1/agent/chats/message",
      requestBody,
      conversationId,
      messageLength: message.length,
      hasClientId: !!clientId,
      hasSharedHomeId: !!sharedHomeId,
      hasSharedDocumentId: !!sharedDocumentId,
    });

    try {
      const response = await apiPost<SendMessageResponse>(
        "/api/v1/agent/chats/message",
        requestBody
      );

      log.debug(LOG_CATEGORIES.API, "Message request response", {
        success: response.success,
        hasError: !!response.error,
        error: response.error,
        message_id: response.message_id,
      });

      return response;
    } catch (error) {
      log.error(LOG_CATEGORIES.API, "Message request failed", {
        error,
        requestBody,
        conversationId,
      });
      throw error;
    }
  },

  /**
   * Create a new conversation between agent and client
   */
  createConversation: (clientId: string): Promise<CreateConversationResponse> =>
    apiPost<CreateConversationResponse>("/api/v1/agent/chats", {
      client_id: clientId,
    }),

  /**
   * Search for agents (for clients)
   */
  searchAgents: (query: string, limit?: number): Promise<SearchAgentsResponse> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append("limit", limit.toString());
    return apiGet<SearchAgentsResponse>(`/api/v1/agent/search-agents?${params.toString()}`);
  },

  /**
   * Recommend agents from optional buyer/search context (zip, state, intent).
   */
  recommendedAgents: (args: {
    zip?: string;
    state?: string;
    intent?: string;
    limit?: number;
  }): Promise<RecommendedAgentsResponse> => {
    const params = new URLSearchParams();
    if (args.zip?.trim()) params.set("zip", args.zip.trim());
    if (args.state?.trim()) params.set("state", args.state.trim().toUpperCase());
    if (args.intent?.trim()) params.set("intent", args.intent.trim());
    if (args.limit != null) params.set("limit", String(args.limit));
    const qs = params.toString();
    return apiGet<RecommendedAgentsResponse>(
      `/api/v1/agent/recommended-agents${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * Search for clients (for agents)
   */
  searchClients: (query: string, limit?: number): Promise<SearchClientsResponse> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append("limit", limit.toString());
    return apiGet<SearchClientsResponse>(`/api/v1/agent/search-clients?${params.toString()}`);
  },

  /**
   * Get connection requests for authenticated user
   */
  getConnectionRequests: (): Promise<ConnectionRequestsResponse> =>
    apiGet<ConnectionRequestsResponse>("/api/v1/agent/connection-requests"),

  /**
   * Create a connection request
   */
  createConnectionRequest: (
    agentId: string,
    clientId: string,
    message?: string
  ): Promise<CreateConnectionRequestResponse> =>
    apiPost<CreateConnectionRequestResponse>("/api/v1/agent/connection-requests", {
      agent_id: agentId,
      client_id: clientId,
      message,
    }),

  /**
   * Respond to a connection request (accept or reject)
   */
  respondToConnectionRequest: (
    requestId: string,
    accept: boolean
  ): Promise<RespondToConnectionRequestResponse> =>
    apiPost<RespondToConnectionRequestResponse>(
      `/api/v1/agent/connection-requests/${requestId}/respond`,
      { accept }
    ),

  /**
   * Mark all messages in a conversation as read
   */
  markMessagesAsRead: (conversationId: string): Promise<MarkMessagesAsReadResponse> =>
    apiPost<MarkMessagesAsReadResponse>(`/api/v1/agent/chats/${conversationId}/read`, {}),

  /**
   * Update event request status (accepted or cancelled) for a calendar event request message
   */
  updateEventRequestStatus: (
    messageId: string,
    status: "accepted" | "cancelled"
  ): Promise<{ success: boolean; error?: string }> =>
    apiPatch<{ success: boolean; error?: string }>(
      `/api/v1/agent/chats/messages/${messageId}/event-request-status`,
      { status }
    ),

  /**
   * Get total notification count (unread messages + pending requests)
   */
  getNotificationCounter: (): Promise<NotificationCounterResponse> =>
    apiGet<NotificationCounterResponse>("/api/v1/agent/notification-counter"),

  /**
   * Get todos for authenticated agent
   */
  getTodos: (includeCompleted?: boolean): Promise<GetTodosResponse> => {
    const params = includeCompleted ? `?include_completed=true` : "";
    return apiGet<GetTodosResponse>(`/api/v1/agent/todos${params}`);
  },

  /**
   * Create a new todo
   */
  createTodo: (data: CreateTodoRequest): Promise<CreateTodoResponse> =>
    apiPost<CreateTodoResponse>("/api/v1/agent/todos", data),

  /**
   * Update a todo
   */
  updateTodo: (todoId: string, data: UpdateTodoRequest): Promise<UpdateTodoResponse> =>
    apiPut<UpdateTodoResponse>(`/api/v1/agent/todos/${todoId}`, data),
};
