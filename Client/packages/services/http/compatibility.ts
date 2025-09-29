/* =========================
   Compatibility Wrapper
   ========================= */

// Import HttpClient class directly to avoid circular dependency
import type {
  ApiResponse,
  FetchJsonOpts,
  RetryOpts,
  ApiRequestOptions,
} from "../../schemas/api";

import {
  HttpClient,
  HttpError,
  AuthenticationError,
  TimeoutError,
  createAbortManager,
  type HttpClientConfig,
  normalizeHeaders,
  normalizeUrl,
  createAuthHeaders,
} from "./client";
// Note: getAuthToken is defined locally in this file to avoid circular dependency

// Create a local httpClient instance to avoid circular dependency
// Use environment variables directly to avoid import.meta issues
type WindowWithEnv = {
  __ENV__?: Record<string, string>;
  getSecureAccessToken?: () => string | null;
  clearSecureTokens?: () => void;
} & Window;

const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof window !== "undefined" && (window as WindowWithEnv).__ENV__) {
    return (window as WindowWithEnv).__ENV__?.[key] ?? defaultValue;
  }
  return defaultValue;
};

const localHttpConfig: HttpClientConfig = {
  baseUrl: getEnvVar("VITE_API_BASE_URL", "").replace(/\/+$/, ""),
  timeout: parseInt(getEnvVar("VITE_API_TIMEOUT", "30000"), 10),
  retries: parseInt(getEnvVar("VITE_API_RETRIES", "2"), 10),
  authTokenProvider: () => {
    try {
      const token = getAuthToken();
      // For HttpOnly cookie approach, we don't need to send Authorization headers
      // The browser automatically includes the HttpOnly cookies
      if (token === "http-only-cookie-auth") {
        return null; // Don't send Authorization header
      }
      return token;
    } catch (error: unknown) {
      console.warn("Failed to get auth token:", error);
      return null;
    }
  },
  onAuthError: (error: Error) => {
    console.warn("Auth error in HTTP client:", error);
    // Note: Removed authChange dispatch to prevent conflicts
  },
};

const httpClient = new HttpClient(localHttpConfig);

const toPlainHeaderObject = normalizeHeaders;
const normalizeBase = normalizeUrl;

export { HttpError, AuthenticationError, TimeoutError };

// Re-export types from centralized schemas
export type { FetchJsonOpts, RetryOpts, ApiRequestOptions };

// Re-export ApiResponse from schemas for compatibility
export type { ApiResponse };

/* =========================
   Core Compatibility Functions
   ========================= */

/**
 * Drop-in replacement for existing fetchJson function
 */
export async function fetchJson<T>(
  url: string,
  opts: FetchJsonOpts = {},
): Promise<T> {
  const { acceptStatuses, timeout, ...requestInit } = opts;

  return httpClient.request<T>(url, {
    ...requestInit,
    acceptStatuses,
    timeout,
    baseUrl: "", // Use full URL as provided
  });
}

/**
 * Drop-in replacement for existing fetchJsonWithRetry function
 */
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
      baseUrl: "", // Use full URL as provided
    },
    retry,
  );
}

/**
 * Drop-in replacement for existing apiRequest function
 * Matches the EXACT logic from fetch.ts
 */
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

  // Construct full URL (avoid double slashes) - using centralized logic
  const base = normalizeBase(
    baseUrl ?? getEnvVar("VITE_API_BASE_URL", "").replace(/\/+$/, ""),
  );
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // Get auth token & build headers - using centralized logic
  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const mergedHeaders = {
    ...createAuthHeaders(token),
    ...toPlainHeaderObject(fetchOptions.headers),
  };

  // Build request options - EXACT same logic
  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers: mergedHeaders,
    mode: useCors ? "cors" : fetchOptions.mode,
    credentials: includeCredentials ? "include" : fetchOptions.credentials,
  };

  try {
    // retry wrapper around fetchJson - EXACT same pattern
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

// Functions now imported from centralized client.ts

/* =========================
   HTTP Method Helpers (from api.ts)
   ========================= */

export function apiGet<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

export function apiPost<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPut<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPatch<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiDelete<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "DELETE",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

/* =========================
   File Upload / Download (from api.ts)
   ========================= */

export function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
): Promise<T> {
  const plain = toPlainHeaderObject(options.headers);
  // Ensure browser sets proper multipart boundary
  delete plain["Content-Type"];

  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    headers: plain,
    body: formData,
  });
}

export async function apiDownloadBlob(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
): Promise<Blob> {
  const {
    includeCredentials = true,
    includeAuth = true,
    authToken,
    timeout = 30000,
    useCors = true,
    baseUrl,
    ...fetchOptions
  } = options;

  const base = normalizeBase(
    baseUrl ?? getEnvVar("VITE_API_BASE_URL", "").replace(/\/+$/, ""),
  );
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const headers = {
    ...toPlainHeaderObject(fetchOptions.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Do NOT force JSON headers here
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeout));

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      method: "GET",
      headers,
      mode: useCors ? "cors" : fetchOptions.mode,
      credentials: includeCredentials ? "include" : fetchOptions.credentials,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HttpError(res.status, url, text.slice(0, 600));
    }

    return await res.blob();
  } finally {
    clearTimeout(timer);
  }
}

/* =========================
   Specialized API Helpers (from api.ts)
   ========================= */

export function apiGetOptional<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body" | "acceptStatuses"> = {},
): Promise<T | null> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "GET",
    acceptStatuses: [404],
  }).catch((error) => {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  });
}

export async function apiAuthRequired<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AuthenticationError("NO_TOKEN", "Authentication required", 401);
  }
  return apiRequest<T>(endpoint, {
    ...options,
    includeAuth: true,
    authToken: token,
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiPoll<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions & {
    maxAttempts?: number;
    intervalMs?: number;
    condition?: (response: T) => boolean;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 10,
    intervalMs = 1000,
    condition = () => true,
    ...requestOptions
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiRequest<T>(endpoint, requestOptions);
      if (condition(response)) return response;
      if (attempt < maxAttempts) await sleep(intervalMs);
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) throw error;
      if (attempt === maxAttempts) throw error;
      await sleep(intervalMs);
    }
  }

  throw new Error(`Polling failed after ${maxAttempts} attempts`);
}

/* =========================
   URL Construction Helpers (from api.ts)
   ========================= */

type QueryValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | (string | number | boolean)[];

export function buildApiUrl(
  endpoint: string,
  params: Record<string, QueryValue> = {},
  baseUrl?: string,
): string {
  const base = normalizeBase(
    baseUrl ?? getEnvVar("VITE_API_BASE_URL", "").replace(/\/+$/, ""),
  );
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

/* =========================
   Response Type Helpers (from api.ts)
   ========================= */

export function isApiResponse<T>(
  response: unknown,
): response is ApiResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    typeof (response as unknown as { success: boolean }).success === "boolean"
  );
}

export function extractApiData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    let message: string | undefined;
    if ("error" in response && typeof response.error === "string") {
      message = response.error;
    } else if ("message" in (response as unknown as Record<string, unknown>)) {
      const maybeMessage = (response as unknown as Record<string, unknown>)
        .message;
      if (typeof maybeMessage === "string") message = maybeMessage;
    }
    const errorMessage = message ?? "API request failed";
    throw new Error(errorMessage);
  }
  return response.data as T;
}

/* =========================
   Legacy Compatibility (from api.ts)
   ========================= */

/** @deprecated Use apiRequest/apiGet/apiPost/etc. instead */
export function legacyApiRequest(
  url: string,
  options: RequestInit = {},
): Promise<unknown> {
  return apiRequest(url, options);
}

/* =========================
   Recreated Utilities (from deleted /api/utils)
   ========================= */

/* =========================
   Auth Utilities (recreated from /api/utils/auth.ts)
   ========================= */

export function getAuthToken(): string | null {
  // Use dynamic import for browser compatibility
  try {
    // Try to get token from secure auth hook first
    if ((window as WindowWithEnv).getSecureAccessToken) {
      const token = (window as WindowWithEnv).getSecureAccessToken?.() ?? null;
      if (token) {
        return token;
      }
    }

    // Fallback to direct sessionStorage access
    const sessionToken = sessionStorage.getItem("access_token");
    if (sessionToken) {
      return sessionToken;
    }

    // Additional fallbacks for compatibility
    const idToken = sessionStorage.getItem("id_token");
    if (idToken) {
      return idToken;
    }

    // Only fallback to localStorage for legacy compatibility
    const localToken = localStorage.getItem("access_token");
    if (localToken) {
      return localToken;
    }

    return null;
  } catch (error: unknown) {
    console.warn("Failed to get auth token:", error);
    return null;
  }
}

// Re-export createAuthHeaders from client.ts for backward compatibility
export { createAuthHeaders } from "./client";

export const routeStartsWith = (prefix: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith(prefix);
};

export const routeMatchesAny = (prefixes: string[]): boolean => {
  return prefixes.some((p) => routeStartsWith(p));
};

/* =========================
   Error Utilities (recreated from /api/utils/errors.ts)
   ========================= */

export function logHttp(scope: string, e: unknown) {
  // Import dynamically to avoid circular dependencies
  import("../security/secureLogger")
    .then(({ log }) => {
      if (e instanceof AuthenticationError) {
        log.security(scope, `Authentication error: ${e.errorCode}`, {
          message: e.message,
        });
      } else if (e instanceof HttpError) {
        log.warn(scope, `HTTP ${e.status} error`, {
          status: e.status,
          url: e.url,
          body: e.bodyPreview,
        });
      } else if (e instanceof Error && e.name === "AbortError") {
        log.debug(scope, "Request aborted");
      } else {
        log.error(scope, "Unexpected HTTP error", e);
      }
    })
    .catch(console.error);
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

export function handleAuthenticationError(error: AuthenticationError) {
  // Import dynamically to avoid circular dependencies
  import("../security/secureLogger")
    .then(({ log }) => {
      log.security("AUTH", "Authentication error detected", {
        errorCode: error.errorCode,
        message: error.message,
      });
    })
    .catch(console.error);

  try {
    // Clear all possible token storage locations securely
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("user");
    // Clear legacy localStorage tokens for compatibility
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear secure auth hook tokens if available
    if ((window as WindowWithEnv).clearSecureTokens) {
      (window as WindowWithEnv).clearSecureTokens?.();
    }
  } catch {
    /* ignore */
  }

  // Notify app contexts/listeners
  try {
    window.dispatchEvent(
      new CustomEvent("authenticationError", {
        detail: { errorCode: error.errorCode, message: error.message },
      }),
    );
  } catch {
    /* ignore */
  }

  // Redirect to login after a brief delay to allow cleanup
  setTimeout(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, 100);
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/* =========================
   Logging Utilities (recreated from /api/utils/logging.ts)
   ========================= */

export function logApiRequest(method: string, url: string) {
  // Import dynamically to avoid circular dependencies
  import("../security/secureLogger")
    .then(({ log }) => {
      log.info("API_REQUEST", `${method} ${url.replace(/\/\d+/g, "/:id")}`);
    })
    .catch(console.error);
}

export function logApiResponse(
  method: string,
  url: string,
  status: number,
  duration?: number,
) {
  // Import dynamically to avoid circular dependencies
  import("../security/secureLogger")
    .then(({ log }) => {
      const durationText = duration ? ` (${duration}ms)` : "";
      log.info(
        "API_RESPONSE",
        `${method} ${url.replace(/\/\d+/g, "/:id")} - ${status}${durationText}`,
      );
    })
    .catch(console.error);
}

/* =========================
   AbortController Utilities
   ========================= */

export { createAbortManager };
