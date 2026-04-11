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

import { apiGet, apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type ChatbotSendRequest = components["schemas"]["ChatbotSendRequest"];
export type ChatbotResponse = components["schemas"]["ChatbotResponse"];
export type ChatbotHistoryMessage =
  components["schemas"]["ChatbotHistoryMessage"];
export type ChatbotHistoryResponse =
  components["schemas"]["ChatbotHistoryResponse"];

/**
 * Chatbot API client for property-report chat (send message, get history).
 */
export const chatbotApi = {
  chatForAddress: (
    reportId: string,
    message: string,
  ): Promise<ChatbotResponse> =>
    apiPost<ChatbotResponse>(`/api/v1/chat/address/${reportId}`, { message }),

  getChatHistory: (reportId: string): Promise<ChatbotHistoryResponse> =>
    apiGet<ChatbotHistoryResponse>(`/api/v1/chat/history/${reportId}`),
};
