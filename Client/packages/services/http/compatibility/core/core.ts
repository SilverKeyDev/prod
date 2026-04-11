/**
 * Core compatibility: fetchJson, fetchJsonWithRetry, apiRequest
 */

import { getEnv } from "packages/config/env";
import {
  AuthenticationError,
  createAuthHeaders,
  normalizeHeaders,
  normalizeUrl,
} from "packages/services/http/client";
import {
  handleAuthenticationError,
  isAuthenticationError,
} from "packages/services/http/compatibility/helpers/errors";
import type {
  ApiRequestOptions,
  ApiResponse,
  FetchJsonOpts,
  RetryOpts,
} from "packages/types/api";
import { getFetch } from "packages/utils/platform";

import { getAuthToken, httpClient } from "./config";

const toPlainHeaderObject = normalizeHeaders;
const normalizeBase = normalizeUrl;

export async function fetchJson<T>(
  url: string,
  opts: FetchJsonOpts = {},
): Promise<T> {
  const { acceptStatuses, timeout, ...requestInit } = opts;
  return httpClient.request<T>(url, {
    ...requestInit,
    acceptStatuses,
    timeout,
    baseUrl: "",
  });
}

export async function fetchJsonWithRetry<T>(
  url: string,
  init: FetchJsonOpts,
  retry: RetryOpts = {},
): Promise<T> {
  const { acceptStatuses, timeout, ...requestInit } = init;
  return httpClient.requestWithRetry<T>(
    url,
    {
      ...requestInit,
      acceptStatuses,
      timeout,
      baseUrl: "",
    },
    retry,
  );
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    includeCredentials = true,
    includeAuth = true,
    authToken,
    acceptStatuses = [],
    timeout = 30000,
    useCors = true,
    baseUrl,
    retries,
    retryOnStatuses,
    retryDelayMs,
    backoffFactor,
    jitter,
    ...fetchOptions
  } = options;

  const base = normalizeBase(
    baseUrl ?? getEnv().apiBaseUrl.replace(/\/+$/, ""),
  );
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const mergedHeaders = {
    ...createAuthHeaders(token),
    ...toPlainHeaderObject(fetchOptions.headers),
  };

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers: mergedHeaders,
    mode: useCors ? "cors" : fetchOptions.mode,
    credentials: includeCredentials ? "include" : fetchOptions.credentials,
  };

  try {
    return await fetchJsonWithRetry<T>(
      url,
      { ...requestOptions, acceptStatuses, timeout },
      { retries, retryOnStatuses, retryDelayMs, backoffFactor, jitter },
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error)) {
      handleAuthenticationError(error as AuthenticationError);
      throw error;
    }
    throw error;
  }
}

export type ApiHeadResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

/**
 * HEAD request for diagnostics (e.g. checking response headers without body).
 * Uses same base URL and auth as apiRequest.
 */
export async function apiHead(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
): Promise<ApiHeadResponse> {
  const {
    includeCredentials = true,
    includeAuth = true,
    authToken,
    baseUrl,
    useCors = true,
    ...fetchOptions
  } = options;

  const base = normalizeBase(
    baseUrl ?? getEnv().apiBaseUrl.replace(/\/+$/, ""),
  );
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const mergedHeaders = {
    ...createAuthHeaders(token),
    ...toPlainHeaderObject(fetchOptions.headers),
  };

  // HEAD requests don't need Content-Type header (no request body)
  // Removing it avoids triggering CORS preflight
  delete mergedHeaders["Content-Type"];
  delete mergedHeaders["content-type"];

  const response = await getFetch()(url, {
    ...fetchOptions,
    method: "HEAD",
    headers: mergedHeaders,
    mode: useCors ? "cors" : fetchOptions.mode,
    credentials: includeCredentials ? "include" : fetchOptions.credentials,
  });

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
  };
}

export type { ApiRequestOptions, ApiResponse, FetchJsonOpts, RetryOpts };
