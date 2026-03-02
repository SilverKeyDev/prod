/* =========================
   HTTP Services - Main Export
   ========================= */

// Core HTTP client
export type { HttpClientConfig, HttpClientOptions, RetryOptions } from "./client";
export {
  AuthenticationError,
  createAbortManager,
  HttpClient,
  HttpError,
  TimeoutError,
} from "./client";

// Configured client instance (single source of truth)
export { configureHttpClient, httpClient } from "./client-instance";

// Base URL utility - removed to avoid circular dependency
// getBaseUrl is available from services/index.ts

// Complete compatibility layer - ALL functions from /api/utils
// Re-export from compatibility layer instead of direct api/utils
export * from "./compatibility";

/* =========================
   Convenience Re-exports
   ========================= */

import type { RetryOptions } from "./client";
import { httpClient } from "./config";

// Export configured client methods for direct use
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
