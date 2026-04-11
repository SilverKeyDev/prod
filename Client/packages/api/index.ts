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
 * Central API exports for SilverKey application.
 * All API clients use the centralized utilities.
 */

export { adminApi } from "./admin";
export { dashboardApi } from "./dashboard";
export { mapsApi } from "./maps";
export { offerApi } from "./offer";
export { agentApi } from "packages/features/agent/api/agent";
export { googleCalendarApi } from "packages/features/calendar/api";
export { reportApi } from "packages/features/documents/api/report";
export { secureUploadApi } from "packages/features/documents/api/secureUpload";
export { feedApi } from "packages/features/feed/api/feed";
export { authApi } from "packages/features/homeauth/api/auth";
export { preferencesApi } from "packages/features/homeauth/api/preferences";
export { userApi } from "packages/features/homeauth/api/user";
export { chatbotApi } from "packages/features/messaging/api/chatbot";
export { researchApi } from "packages/features/search/api/research";
export { searchApi } from "packages/features/search/api/search";
export { searchDisplayApi } from "packages/features/search/api/searchDisplay";

// Note: HTTP utility functions are now imported directly where needed
// to avoid circular dependencies between config/api and services/http

// Re-export HTTP utilities for backward compatibility
export {
  apiDelete,
  apiDownloadBlob,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  apiRequest,
  apiUpload,
} from "packages/services/http/compatibility";

// Re-export types from individual API modules
export type {
  DashboardResponse,
  ReportsResponse,
  WorkflowDocumentRecord,
} from "./dashboard";
export type { MapsScriptResponse } from "./maps";
export type {
  CommuteData,
  NegotiationStrategyRequest,
  NegotiationStrategyResponse,
  PropertyData,
} from "./offer";
export type {
  AgentChatHistoryResponse,
  AgentChatMessage,
  AgentClient,
  AgentClientsResponse,
  AgentConnectionRequest,
  AgentConversation,
  AgentConversationsResponse,
  AgentSearchResult,
  ClientSearchResult,
  ConnectionRequestsResponse,
  CreateConnectionRequestRequest,
  CreateConnectionRequestResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  CreateTodoRequest,
  RespondToConnectionRequestRequest,
  RespondToConnectionRequestResponse,
  SearchAgentsResponse,
  SearchClientsResponse,
  SendMessageRequest,
  SendMessageResponse,
  TodoItem,
  UpdateTodoRequest,
} from "packages/features/agent/api/agent";
export type {
  GoogleCalendar,
  GoogleCalendarApiResponse,
  GoogleCalendarEventCreateBody,
  GoogleCalendarListResponse,
  GoogleEvent,
  GoogleEventCreateResponse,
  GoogleEventListResponse,
} from "packages/features/calendar/api";
export type {
  CompareReportsRequest,
  CompareReportsResponse,
  DeleteReportResponse,
  DownloadUrlResponse,
  PollReportResponse,
  ReportDocument,
  ReportsListResponse,
  ViewUrlResponse,
} from "packages/features/documents/api/report";
export type { UploadResponse } from "packages/features/documents/api/secureUpload";
export type {
  AuthResponse,
  LoginData,
  SignupData,
} from "packages/features/homeauth/api/auth";
export type {
  ClientInfo,
  ClientsResponse,
  PreferencesResponse,
} from "packages/features/homeauth/api/preferences";
export type {
  AddFavoriteRequest,
  FavoriteHomesReplaceResponse,
  FavoriteHomesResponse,
  RemoveFavoriteRequest,
  User,
  UserResponse,
} from "packages/features/homeauth/api/user";
export type {
  ChatbotHistoryMessage,
  ChatbotHistoryResponse,
  ChatbotResponse,
  ChatbotSendRequest,
} from "packages/features/messaging/api/chatbot";
export type {
  PropertyRequest,
  PropertyResponse,
  TaskStatusResponse,
} from "packages/features/search/api/research";
export type {
  IsochroneResponse,
  MonthlyCostEstimatesResponse,
  PolygonSearchRequest,
  PolygonSearchResponse,
  PropertyCompsRequest,
  PropertyCompsResponse,
} from "packages/features/search/api/search";
