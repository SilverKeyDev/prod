/**
 * Re-export chatbot API and types from the feature API layer.
 * For direct API usage prefer: import { chatbotApi } from "packages/api";
 */

export {
  chatbotApi,
  type ChatbotHistoryMessage,
  type ChatbotHistoryResponse,
  type ChatbotResponse,
  type ChatbotSendRequest,
} from "../api/chatbot";
