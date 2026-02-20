/**
 * Compatibility layer - single entry point re-exporting all modules
 */

export {
  createAuthHeaders,
  routeMatchesAny,
  routeStartsWith,
} from "./auth/auth";
export { getAuthToken } from "./core/config";
export type {
  ApiRequestOptions,
  ApiResponse,
  FetchJsonOpts,
  RetryOpts,
} from "./core/core";
export type { ApiHeadResponse } from "./core/core";
export {
  apiHead,
  apiRequest,
  fetchJson,
  fetchJsonWithRetry,
} from "./core/core";
export { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./core/methods";
export {
  handleAuthenticationError,
  isAbortError,
  isAuthenticationError,
  logHttp,
} from "./helpers/errors";
export { logApiRequest, logApiResponse } from "./helpers/logging";
export { extractApiData, isApiResponse } from "./helpers/responseHelpers";
export type { QueryValue } from "./helpers/urlHelpers";
export { buildApiUrl } from "./helpers/urlHelpers";
export { legacyApiRequest } from "./legacy";
export { apiAuthRequired, apiGetOptional, apiPoll } from "./specialized";
export { apiDownloadBlob, apiUpload } from "./uploadDownload";
export {
  AuthenticationError,
  createAbortManager,
  HttpError,
  TimeoutError,
} from "packages/services/http/client";
