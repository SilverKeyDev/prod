import { apiGet, apiPost } from "packages/services/http/compatibility";

/** Request body for sending a message to the property chatbot */
export type ChatbotSendRequest = {
  message: string;
};

/** Response from property chatbot after sending a message */
export type ChatbotResponse = {
  response: string;
  function_call?: unknown;
  message_id: string;
  message_summary: string;
};

/** Single message in chatbot history (API shape) */
export type ChatbotHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
};

/** Response from get chat history for a property report */
export type ChatbotHistoryResponse = {
  messages: ChatbotHistoryMessage[];
};

/**
 * Chatbot API client for property-report chat (send message, get history).
 */
export const chatbotApi = {
  chatForAddress: (reportId: string, message: string): Promise<ChatbotResponse> =>
    apiPost<ChatbotResponse>(`/api/v1/chat/address/${reportId}`, { message }),

  getChatHistory: (reportId: string): Promise<ChatbotHistoryResponse> =>
    apiGet<ChatbotHistoryResponse>(`/api/v1/chat/history/${reportId}`),
};
