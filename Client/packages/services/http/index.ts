/* =========================
   HTTP Services - Main Export
   ========================= */

export { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./apiMethods";
export type { ApiHeadResponse } from "./apiRequest";
export type { ApiRequestOptions, ApiResponse, FetchJsonOpts, RetryOpts } from "./apiRequest";
export { apiHead, apiRequest, fetchJson, fetchJsonWithRetry } from "./apiRequest";
export { getAuthToken } from "./authToken";
export type { HttpClientConfig, HttpClientOptions, RetryOptions } from "./client";
export {
  AuthenticationError,
  createAbortManager,
  HttpClient,
  HttpError,
  isAbortError,
  TimeoutError,
} from "./client";
export { configureHttpClient, httpClient } from "./client-instance";
export { apiDownloadBlob, apiUpload } from "./fileTransfer";
export { extractApiData, isApiResponse } from "./responseHelpers";
export { createAuthHeaders, routeMatchesAny, routeStartsWith } from "./routeHelpers";
export { apiAuthRequired, apiGetOptional, apiPoll } from "./specializedApi";
export type { QueryValue } from "./urlHelpers";
export { buildApiUrl } from "./urlHelpers";

import type { RetryOptions } from "./client";
import { httpClient } from "./client-instance";

export const httpGet = (url: string, config?: RequestInit) => httpClient.get(url, config);
export const httpPost = (url: string, data?: unknown, config?: RequestInit) =>
  httpClient.post(url, data, config);
export const httpPut = (url: string, data?: unknown, config?: RequestInit) =>
  httpClient.put(url, data, config);
export const httpPatch = (url: string, data?: unknown, config?: RequestInit) =>
  httpClient.patch(url, data, config);
export const httpDelete = (url: string, config?: RequestInit) => httpClient.delete(url, config);
export const httpRequest = (url: string, config?: RequestInit) => httpClient.request(url, config);
export const httpRequestWithRetry = (url: string, config?: RequestInit, retry?: RetryOptions) =>
  httpClient.requestWithRetry(url, config, retry);
