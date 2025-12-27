import { apiGet, apiPost } from "../../services/http/compatibility";

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
};

export type AgentChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  role: "user" | "agent" | "assistant";
  message: string;
  shared_home_id?: string | null;
  timestamp: string;
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
};
