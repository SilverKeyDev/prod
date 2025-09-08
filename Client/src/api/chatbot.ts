import { apiPost, apiGet } from './utils/index';

// Types for chatbot API
export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  response: string;
  function_call?: any;
  message_id: string;
  message_summary: string;
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
}

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