import { apiGet, apiPost, apiPut } from "../../services/http/compatibility";

// Types for agent API
export type AgentClient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
};

export type AgentConversation = {
  id: string;
  agent_id: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  agent_name?: string;
  agent_email?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_read_at?: string;
};

export type AgentChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  role: "user" | "agent" | "assistant";
  message: string;
  shared_home_id?: string | null;
  timestamp: string;
  is_read?: boolean;
  read_at?: string | null;
};

export type AgentClientsResponse = {
  success: boolean;
  clients?: AgentClient[];
  message?: string;
  error?: string;
};

export type AgentConversationsResponse = {
  success: boolean;
  conversations?: AgentConversation[];
  message?: string;
  error?: string;
};

export type AgentChatHistoryResponse = {
  success: boolean;
  messages?: AgentChatMessage[];
  conversation?: AgentConversation;
  message?: string;
  error?: string;
};

export type SendMessageRequest = {
  conversation_id: string;
  message: string;
  client_id?: string; // Required when conversation_id is "new" and user is an agent
  shared_home_id?: string;
};

export type SendMessageResponse = {
  success: boolean;
  message_id?: string;
  message?: string;
  error?: string;
};

export type CreateConversationRequest = {
  client_id: string;
};

export type CreateConversationResponse = {
  success: boolean;
  conversation?: AgentConversation;
  message?: string;
  error?: string;
};

export type AgentSearchResult = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
};

export type ClientSearchResult = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
};

export type AgentConnectionRequest = {
  id: string;
  agent_id: string;
  client_id: string;
  requested_by_agent: boolean;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  other_party_name?: string;
  other_party_email?: string;
  created_at: string;
};

export type SearchAgentsResponse = {
  success: boolean;
  agents?: AgentSearchResult[];
  message?: string;
  error?: string;
};

export type SearchClientsResponse = {
  success: boolean;
  clients?: ClientSearchResult[];
  message?: string;
  error?: string;
};

export type ConnectionRequestsResponse = {
  success: boolean;
  requests?: AgentConnectionRequest[];
  message?: string;
  error?: string;
};

export type CreateConnectionRequestRequest = {
  agent_id: string;
  client_id: string;
  message?: string;
};

export type CreateConnectionRequestResponse = {
  success: boolean;
  request?: AgentConnectionRequest;
  message?: string;
  error?: string;
};

export type RespondToConnectionRequestRequest = {
  accept: boolean;
};

export type RespondToConnectionRequestResponse = {
  success: boolean;
  request?: AgentConnectionRequest;
  message?: string;
  error?: string;
};

export type MarkMessagesAsReadResponse = {
  success: boolean;
  marked_count?: number;
  message?: string;
  error?: string;
};

export type NotificationCounterResponse = {
  success: boolean;
  total_count: number;
  error?: string;
};

export type TodoItem = {
  id: string;
  agent_id: string;
  client_id?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  type: "deadline" | "follow_up" | "inspection" | "offer_expiration" | "closing" | "manual";
  due_date: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type GetTodosResponse = {
  success: boolean;
  todos?: TodoItem[];
  message?: string;
  error?: string;
};

export type CreateTodoRequest = {
  title: string;
  due_date: string;
  priority?: "low" | "medium" | "high" | "urgent";
  type?: "deadline" | "follow_up" | "inspection" | "offer_expiration" | "closing" | "manual";
  client_id?: string;
  description?: string;
};

export type CreateTodoResponse = {
  success: boolean;
  todo?: TodoItem;
  message?: string;
  error?: string;
};

export type UpdateTodoRequest = {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  type?: "deadline" | "follow_up" | "inspection" | "offer_expiration" | "closing" | "manual";
  due_date?: string;
  completed?: boolean;
  client_id?: string;
};

export type UpdateTodoResponse = {
  success: boolean;
  todo?: TodoItem;
  message?: string;
  error?: string;
};

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
    apiGet<AgentChatHistoryResponse>(
      `/api/v1/agent/chats/${conversationId}/history`
    ),

  /**
   * Send a message in a conversation
   */
  sendMessage: (
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string
  ): Promise<SendMessageResponse> =>
    apiPost<SendMessageResponse>("/api/v1/agent/chats/message", {
      conversation_id: conversationId,
      message,
      ...(clientId && { client_id: clientId }),
      ...(sharedHomeId && { shared_home_id: sharedHomeId }),
    }),

  /**
   * Create a new conversation between agent and client
   */
  createConversation: (
    clientId: string
  ): Promise<CreateConversationResponse> =>
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
  markMessagesAsRead: (
    conversationId: string
  ): Promise<MarkMessagesAsReadResponse> =>
    apiPost<MarkMessagesAsReadResponse>(
      `/api/v1/agent/chats/${conversationId}/read`,
      {}
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
    const params = includeCompleted
      ? `?include_completed=true`
      : "";
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
  updateTodo: (
    todoId: string,
    data: UpdateTodoRequest
  ): Promise<UpdateTodoResponse> =>
    apiPut<UpdateTodoResponse>(`/api/v1/agent/todos/${todoId}`, data),
};
