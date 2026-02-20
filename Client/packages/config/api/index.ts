// Central API exports for SilverKey application
// All API clients use the centralized utilities from ./utils.ts

export { agentApi } from "./agent/agent";
export { authApi } from "./auth/auth";
export { preferencesApi } from "./auth/preferences";
export { userApi } from "./auth/user";
export { googleCalendarApi } from "./calendar/googleCalendar";
export { chatbotApi } from "./chat/chatbot";
export { dashboardApi } from "./core/dashboard";
export { docusignApi } from "./documents/docusign";
export { reportApi } from "./documents/report";
export { secureUploadApi } from "./documents/secureUpload";
export { feedApi } from "./feed/feed";
export { offerApi } from "./offer";
export { researchApi } from "./search/research";
export { searchApi } from "./search/search";
export { mapsApi } from "./standalone/maps";

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
} from "./agent/agent";
export type { AuthResponse, LoginData, SignupData } from "./auth/auth";
export type {
  ClientInfo,
  ClientsResponse,
  PreferencesResponse,
} from "./auth/preferences";
export type {
  AddFavoriteRequest,
  FavoriteHomesResponse,
  RemoveFavoriteRequest,
  User,
  UserResponse,
} from "./auth/user";
export type {
  GoogleCalendar,
  GoogleCalendarApiResponse,
  GoogleCalendarListResponse,
  GoogleEvent,
  GoogleEventCreateResponse,
  GoogleEventListResponse,
} from "./calendar/googleCalendar";
export type {
  ChatHistoryMessage,
  ChatHistoryResponse,
  ChatMessage,
  ChatResponse,
} from "./chat/chatbot";
export type {
  Document as DashboardDocument,
  DashboardResponse,
  ReportsResponse,
} from "./core/dashboard";
export type {
  Agreement,
  AgreementEvent,
  AgreementParticipant,
  AgreementRevision,
  AgreementStatus,
  AgreementType,
  CreateAgreementRequest,
  CreateAgreementResponse,
  CreateRevisionResponse,
  DocusignTemplate,
  GetAgreementResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  ListAgreementsResponse,
  ListTemplatesResponse,
  OAuthStartResponse,
  ParticipantRole,
  ParticipantStatus,
  SendAgreementRequest,
  SendAgreementResponse,
  SigningMethod,
  SyncTemplatesResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
} from "./documents/docusign";
export type {
  CompareReportsRequest,
  CompareReportsResponse,
  DeleteReportResponse,
  DownloadUrlResponse,
  PollReportResponse,
  ReportDocument,
  ReportsListResponse,
  ViewUrlResponse,
} from "./documents/report";
export type { UploadResponse } from "./documents/secureUpload";
export type {
  CommuteData,
  NegotiationStrategyRequest,
  NegotiationStrategyResponse,
  PropertyData,
} from "./offer";
export type {
  PropertyRequest,
  PropertyResponse,
  TaskStatusResponse,
} from "./search/research";
export type {
  IsochroneResponse,
  PolygonSearchRequest,
  PolygonSearchResponse,
  PropertyCompsRequest,
  PropertyCompsResponse,
} from "./search/search";
export type { MapsScriptResponse } from "./standalone/maps";
