// Central API exports for SilverKey application
// All API clients use the centralized utilities from ./utils.ts

export { authApi } from "./auth";
export { chatbotApi } from "./chatbot";
export { dashboardApi } from "./dashboard";
export { googleCalendarApi } from "./googleCalendar";
export { homeMatchingApi } from "./homeMatching";
export { mapsApi } from "./maps";
export { offerApi } from "./offer";
export { preferencesApi } from "./preferences";
export { reportApi } from "./report";
export { searchApi } from "./search";
export { secureUploadApi } from "./secureUpload";
export { userApi } from "./user";

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
export type { SignupData, LoginData, AuthResponse } from "./auth";
export type {
  ChatMessage,
  ChatResponse,
  ChatHistoryMessage,
  ChatHistoryResponse,
} from "./chatbot";
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
} from "./googleCalendar";
export type {
  HomeMatchingRequest,
  HomeMatchingResponse,
  TaskStatusResponse,
} from "./homeMatching";
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
} from "./preferences";
export type {
  GenerateReportRequest,
  ReportDocument,
  GenerateReportResponse,
  ReportsListResponse,
  PollReportResponse,
  DownloadUrlResponse,
  ViewUrlResponse,
  CompareReportsRequest,
  CompareReportsResponse,
  DeleteReportResponse,
} from "./report";
export type {
  PropertyCompsRequest,
  PropertyCompsResponse,
  PropertyRequest,
  PropertyResponse,
  PolygonSearchRequest,
  PolygonSearchResponse,
  IsochroneResponse,
} from "./search";
export type { UploadResponse } from "./secureUpload";
export type {
  User,
  UserResponse,
  FavoriteHomesResponse,
  AddFavoriteRequest,
  RemoveFavoriteRequest,
} from "./user";
