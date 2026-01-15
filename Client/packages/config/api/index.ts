// Central API exports for SilverKey application
// All API clients use the centralized utilities from ./utils.ts

export { agentApi } from "./agent/agent";
export { authApi } from "./auth/auth";
export { chatbotApi } from "./chat/chatbot";
export { dashboardApi } from "./dashboard";
export { googleCalendarApi } from "./calendar/googleCalendar";
export { mapsApi } from "./maps";
export { offerApi } from "./offer";
export { preferencesApi } from "./auth/preferences";
export { reportApi } from "./documents/report";
export { researchApi } from "./search/research";
export { searchApi } from "./search/search";
export { secureUploadApi } from "./documents/secureUpload";
export { userApi } from "./auth/user";

// Note: HTTP utility functions are now imported directly where needed
// to avoid circular dependencies between config/api and services/http

// Re-export HTTP utilities for backward compatibility
export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  apiDownloadBlob,
} from "../../services/http/compatibility";

// Re-export types from individual API modules
export type {
  AgentClient,
  AgentConversation,
  AgentChatMessage,
  AgentClientsResponse,
  AgentConversationsResponse,
  AgentChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
  AgentSearchResult,
  ClientSearchResult,
  AgentConnectionRequest,
  SearchAgentsResponse,
  SearchClientsResponse,
  ConnectionRequestsResponse,
  CreateConnectionRequestRequest,
  CreateConnectionRequestResponse,
  RespondToConnectionRequestRequest,
  RespondToConnectionRequestResponse,
} from "./agent/agent";
export type { SignupData, LoginData, AuthResponse } from "./auth/auth";
export type {
  ChatMessage,
  ChatResponse,
  ChatHistoryMessage,
  ChatHistoryResponse,
} from "./chat/chatbot";
export type {
  PDFDocument,
  DashboardResponse,
  ReportsResponse,
} from "./dashboard";
export type {
  GoogleCalendar,
  GoogleEvent,
  GoogleCalendarListResponse,
  GoogleEventListResponse,
  GoogleEventCreateResponse,
  GoogleCalendarApiResponse,
} from "./calendar/googleCalendar";
export type { MapsScriptResponse } from "./maps";
export type {
  NegotiationStrategyRequest,
  NegotiationStrategyResponse,
  PropertyData,
  CommuteData,
} from "./offer";
export type {
  PreferencesResponse,
  ClientInfo,
  ClientsResponse,
} from "./auth/preferences";
export type {
  ReportDocument,
  ReportsListResponse,
  PollReportResponse,
  DownloadUrlResponse,
  ViewUrlResponse,
  CompareReportsRequest,
  CompareReportsResponse,
  DeleteReportResponse,
} from "./documents/report";
export type {
  PropertyRequest,
  PropertyResponse,
  TaskStatusResponse,
} from "./search/research";
export type {
  PropertyCompsRequest,
  PropertyCompsResponse,
  PolygonSearchRequest,
  PolygonSearchResponse,
  IsochroneResponse,
} from "./search/search";
export type { UploadResponse } from "./documents/secureUpload";
export type {
  User,
  UserResponse,
  FavoriteHomesResponse,
  AddFavoriteRequest,
  RemoveFavoriteRequest,
} from "./auth/user";
