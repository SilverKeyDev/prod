import { apiPost, apiGet } from "../../services/http/compatibility";

// Types for chatbot API
export type ChatMessage = {
  message: string;
};

export type ChatResponse = {
  response: string;
  function_call?: unknown;
  message_id: string;
  message_summary: string;
};

export type ChatHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
};

export type ChatHistoryResponse = {
  messages: ChatHistoryMessage[];
};

/**
 * Chatbot API client using centralized utilities
 */
export const chatbotApi = {
  /**
   * Send a chat message for a specific property report
   */
  chatForAddress: (reportId: string, message: string): Promise<ChatResponse> =>
    apiPost<ChatResponse>(`/api/v1/chat/address/${reportId}`, { message }),

  /**
   * Get chat history for a specific property report
   */
  getChatHistory: (reportId: string): Promise<ChatHistoryResponse> =>
    apiGet<ChatHistoryResponse>(`/api/v1/chat/history/${reportId}`),
};
