// Central API exports for SilverKey application
// All API clients use the centralized utilities from ./utils.ts

export { authApi } from './auth';
export { chatbotApi } from './chatbot';
export { dashboardApi } from './dashboard';
export { homeMatchingApi } from './homeMatching';
export { mapsApi } from './maps';
export { offerApi } from './offer';
export { paymentApi } from './payment';
export { preferencesApi } from './preferences';
export { reportApi } from './report';
export { searchApi } from './search';
export { secureUploadApi } from './secureUpload';
export { userApi } from './user';

// Re-export utility functions for direct use
export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  apiGetOptional,
  apiAuthRequired,
  apiPoll,
  buildApiUrl,
  HttpError,
  AuthenticationError,
  isAuthenticationError,
  handleAuthenticationError,
  logHttp,
  getAuthToken,
  createAuthHeaders,
} from './utils/index';

// Re-export types
export type { ApiResponse, ApiRequestOptions } from './utils/index';

// Re-export types from individual API modules
export type { SignupData, VerifyData, LoginData, AuthResponse } from './auth';
export type { ChatMessage, ChatResponse, ChatHistoryMessage, ChatHistoryResponse } from './chatbot';
export type { PDFDocument, DashboardResponse, ReportsResponse } from './dashboard';
export type { HomeMatchingRequest, HomeMatchingResponse, TaskStatusResponse } from './homeMatching';
export type { MapsScriptResponse } from './maps';
export type { NegotiationStrategyRequest, NegotiationStrategyResponse, PropertyData, CommuteData } from './offer';
export type { SubscriptionStatus, CheckoutSessionRequest, CheckoutSessionResponse, PortalSessionResponse } from './payment';
export type { PreferencesResponse, ClientInfo, ClientsResponse } from './preferences';
export type { GenerateReportRequest, ReportDocument, GenerateReportResponse, ReportsListResponse, PollReportResponse, DownloadUrlResponse, ViewUrlResponse, CompareReportsRequest, CompareReportsResponse, DeleteReportResponse } from './report';
export type { PropertyCompsRequest, PropertyCompsResponse, PropertyRequest, PropertyResponse, PolygonSearchRequest, PolygonSearchResponse, IsochroneResponse } from './search';
export type { UploadResponse } from './secureUpload';
export type { User, UserResponse, FavoriteHomesResponse, AddFavoriteRequest, RemoveFavoriteRequest } from './user';