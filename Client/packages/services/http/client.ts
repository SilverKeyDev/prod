/* =========================
   HTTP Client Foundation
   ========================= */

// Pure HTTP client with no React dependencies
// Handles retry, timeout, error handling, and authentication
// Import existing logging and error utilities for compatibility

// Import auth token directly to avoid circular dependencies
// Note: getAuthToken will be used by the configured client in config.ts
import { asError } from "../../utils/error";

// Module-scope single-flight verification state and auth event broadcast
let verifyingPromise: Promise<{ success?: boolean } | null> | null = null;
let lastAuthEventAt = 0;
const AUTH_COOLDOWN_MS = 3000;
const isAuthEndpoint = (url: string): boolean =>
  /\/api\/v1\/(auth\/(verify|login|logout)|user\/profile)/.test(url);
let authBroadcastChannel: BroadcastChannel | null = null;
function getAuthBC(): BroadcastChannel | null {
  if (authBroadcastChannel) return authBroadcastChannel;
  try {
    authBroadcastChannel = new BroadcastChannel("auth");
  } catch {
    authBroadcastChannel = null;
  }
  return authBroadcastChannel;
}

/* =========================
   Types & Interfaces
   ========================= */

export type HttpClientOptions = {
  timeout?: number;
  acceptStatuses?: number[];
  baseUrl?: string;
  includeAuth?: boolean;
  authToken?: string;
  includeCredentials?: boolean;
  useCors?: boolean;
} & RequestInit;

export type RetryOptions = {
  retries?: number;
  retryOnStatuses?: number[];
  retryDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
};

export type HttpClientConfig = {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  authTokenProvider?: () => string | null;
  onAuthError?: (error: AuthenticationError) => void;
};

/* =========================
   Error Classes
   ========================= */

// Match existing HttpError structure exactly
export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public bodyPreview: string,
    public parsedBody?: unknown,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

// Match existing AuthenticationError structure exactly
export class AuthenticationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public status: number,
  ) {
    super(`Authentication error: ${errorCode} - ${message}`);
    this.name = "AuthenticationError";
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = "TimeoutError";
  }
}

/* =========================
   Utility Functions
   ========================= */

// Centralized header normalization
export function normalizeHeaders(
  headers?: HeadersInit,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => (result[key] = value));
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      result[key] = value;
    }
  } else {
    Object.assign(result, headers);
  }

  return result;
}

// Centralized URL normalization
export function normalizeUrl(base: string): string {
  return base.replace(/\/+$/, "");
}

// Centralized auth headers creation
export function createAuthHeaders(
  token?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================
   Core HTTP Client Class
   ========================= */

export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "",
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 2,
      authTokenProvider: config.authTokenProvider ?? (() => null),
      onAuthError: config.onAuthError ?? (() => {}),
    };
  }

  /* =========================
     Low-level Request Method
     ========================= */

  async request<T>(
    endpoint: string,
    options: HttpClientOptions = {},
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      acceptStatuses = [],
      baseUrl,
      includeAuth = true,
      authToken,
      includeCredentials = true,
      useCors = true,
      ...fetchOptions
    } = options;

    // Build URL (avoid double slashes) - matching existing logic exactly
    const base = normalizeUrl(baseUrl ?? this.config.baseUrl);
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    // Get auth token
    const token =
      authToken ?? (includeAuth ? this.config.authTokenProvider() : null);

    // Build headers
    const authHeaders = includeAuth ? createAuthHeaders(token) : {};
    const mergedHeaders = {
      ...authHeaders,
      ...normalizeHeaders(fetchOptions.headers),
    };

    // Build request options
    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: mergedHeaders,
      mode: useCors ? "cors" : (fetchOptions.mode ?? "same-origin"),
      credentials: includeCredentials
        ? "include"
        : (fetchOptions.credentials ?? "same-origin"),
    };

    // CSRF protection: add X-CSRF-Token for unsafe methods when a meta token is present
    try {
      const methodUpper = (requestOptions.method ?? "GET").toUpperCase();
      const isStateChanging = /^(POST|PUT|PATCH|DELETE)$/.test(methodUpper);
      const csrf =
        typeof document !== "undefined"
          ? (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content
          : undefined;
      if (isStateChanging && csrf) {
        (requestOptions.headers as Record<string, string>)["X-CSRF-Token"] = csrf;
      }
    } catch {
      // best-effort; never throw from CSRF header injection
    }

    // Log request
    const method = (requestOptions.method ?? "GET").toUpperCase();
    const startTime = Date.now();
    this.logApiRequest(method, url);

    // Setup timeout with existing signal handling logic
    let controller: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let signal: AbortSignal;

    if (requestOptions.signal) {
      // Use existing signal if provided
      ({ signal } = requestOptions);
    } else {
      // Create new controller with timeout
      controller = new AbortController();
      timeoutId = setTimeout(
        () => {
          if (controller && !controller.signal.aborted) {
            controller.abort(new Error("Request timeout"));
          }
        },
        Math.max(300000, timeout),
      ); // Minimum 5 minutes for AI operations
      ({ signal } = controller);
    }

    try {
      // Log detailed request information before making the request
      // Mask sensitive token data for security
      const maskedHeaders = { ...mergedHeaders };
      if (maskedHeaders.Authorization) {
        const authValue = maskedHeaders.Authorization;
        if (authValue.startsWith("Bearer ")) {
          const tokenPart = authValue.substring(7);
          maskedHeaders.Authorization = `Bearer ${tokenPart.substring(0, 10)}...${tokenPart.substring(tokenPart.length - 10)}`;
        }
      }

      // Get all cookies for debugging
      const allCookies = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);

      let response = await fetch(url, {
        ...requestOptions,
        signal,
      });

      // Centralized 401 handling with single-flight re-verify; avoid loops on auth endpoints
      if (response.status === 401 && !isAuthEndpoint(url)) {
        const now = Date.now();
        if (!verifyingPromise && now - lastAuthEventAt > AUTH_COOLDOWN_MS) {
          lastAuthEventAt = now;
          verifyingPromise = import("../../config/api/auth")
            .then(({ authApi }) => authApi.verifySession())
            .catch(() => null)
            .finally(() => {
              verifyingPromise = null;
            });
          verifyingPromise.then((v) => {
            if (!v?.success) {
              try {
                getAuthBC()?.postMessage({ type: "logout" });
              } catch {
                /* ignore */
              }
            }
          });
        }
        // Return original 401; callers handle unauthenticated state
      }

      const contentType = response.headers.get("content-type") ?? "";
      const responseText = await response.text();

      // Get cookies AFTER the response to see if any were set
      const cookiesAfter = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);

      // Special logging for auth responses
      if (url.includes("/auth/") || response.status === 401) {
        console.log("🔐 AUTH_RESPONSE_DETECTED", {
          url,
          status: response.status,
          cookiesBefore: allCookies,
          cookiesAfter: cookiesAfter,
          newCookies: cookiesAfter.filter((c) => !allCookies.includes(c)),
          corsOrigin: response.headers.get("access-control-allow-origin"),
          corsCredentials: response.headers.get(
            "access-control-allow-credentials",
          ),
        });
      }

      // Handle non-OK responses
      if (!response.ok && !acceptStatuses.includes(response.status)) {
        let parsedBody: unknown;

        try {
          if (contentType.includes("application/json") && responseText.trim()) {
            parsedBody = JSON.parse(responseText);

            // Check for authentication errors
            if (
              response.status === 401 &&
              parsedBody &&
              typeof parsedBody === "object" &&
              "error" in parsedBody
            ) {
              const authErrorCodes = [
                "TOKEN_EXPIRED",
                "INVALID_TOKEN",
                "UNAUTHORIZED",
                "NO_TOKEN",
              ];
              const errorBody = parsedBody as {
                error: string;
                message?: string;
              };

              console.error("❌ AUTH_ERROR_401", {
                url,
                errorCode: errorBody.error,
                message: errorBody.message,
                hasCookies: allCookies.length > 0,
                cookies: allCookies,
                requestCredentials: requestOptions.credentials,
                corsOrigin: response.headers.get("access-control-allow-origin"),
                corsCredentials: response.headers.get(
                  "access-control-allow-credentials",
                ),
                currentOrigin: window.location.origin,
              });

              if (authErrorCodes.includes(errorBody.error)) {
                const authError = new AuthenticationError(
                  errorBody.error,
                  errorBody.message ?? "Authentication required",
                  response.status,
                );
                // Don't call onAuthError here - handleAuthenticationError will be called in catch block
                throw authError;
              }
            }
          }
        } catch (parseError: unknown) {
          const error = asError(parseError);
          if (error instanceof AuthenticationError) throw error;
          // Continue with HttpError for non-JSON responses
        }

        // Enhanced logging for 502 Bad Gateway errors
        if (response.status === 502) {
          console.error("HTTP_502_BAD_GATEWAY", {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            responseText: responseText,
            parsedBody,
            headers: Object.fromEntries(response.headers.entries()),
            requestHeaders: mergedHeaders,
            timestamp: new Date().toISOString(),
          });
        }

        throw new HttpError(
          response.status,
          url,
          responseText.slice(0, 600),
          parsedBody,
        );
      }

      // Handle non-JSON responses
      if (!contentType.includes("application/json")) {
        if (
          acceptStatuses.includes(response.status) ??
          responseText.trim() === ""
        ) {
          return undefined as unknown as T;
        }
        throw new Error(
          `Expected JSON from ${url} but got ${contentType ?? "unknown type"}. Body: ${responseText.slice(0, 200)}`,
        );
      }

      // Parse and return JSON
      try {
        const responseData = JSON.parse(responseText) as T;
        const duration = Date.now() - startTime;
        this.logApiResponse(method, url, response.status, duration);

        return responseData;
      } catch {
        const duration = Date.now() - startTime;
        this.logApiResponse(method, url, response.status, duration);
        throw new Error(
          `Invalid JSON from ${url}. Body: ${responseText.slice(0, 200)}`,
        );
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      // Log error responses
      if (error instanceof HttpError) {
        this.logApiResponse(method, url, error.status, duration);
      } else if (error instanceof AuthenticationError) {
        this.logApiResponse(method, url, error.status, duration);
        // Handle auth error
        this.handleAuthenticationError(error);
      } else {
        // Sanitize URL for logging (replace UUIDs and numeric IDs)
        const sanitizedUrl = url
          .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
          .replace(/\/\d+/g, "/:id");
        
        // Determine error type for better debugging
        const errorType = error instanceof Error ? error.name : "Unknown";
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = error instanceof Error && (
          error.name === "TimeoutError" || 
          error.message.includes("timeout") ||
          error.message.includes("aborted")
        );
        const isAbort = error instanceof Error && error.name === "AbortError";
        const isNetworkError = error instanceof Error && (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("network") ||
          error.message.includes("CORS") ||
          error.message.includes("load failed")
        );
        
        console.error("API_REQUEST", `${method} ${sanitizedUrl} - Network Error`, {
          method,
          url: sanitizedUrl,
          originalUrl: url, // Include original URL for debugging
          errorType,
          errorMessage,
          error: errorMessage,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          isTimeout,
          isAbort,
          isNetworkError,
          // Include full error object for debugging (will show in console)
          fullError: error,
        });
      }

      // Re-throw known types / aborts as-is (matching existing behavior)
      if (error instanceof AuthenticationError) throw error;
      if (error instanceof HttpError) throw error;
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
      )
        throw error;

      // Wrap other errors
      throw new Error(
        `Network error for ${url}: ${error instanceof Error ? error.message : typeof error === "object" && error !== null ? JSON.stringify(error) : String(error)}`,
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /* =========================
     Retry Wrapper
     ========================= */

  async requestWithRetry<T>(
    endpoint: string,
    options: HttpClientOptions = {},
    retryOptions: RetryOptions = {},
  ): Promise<T> {
    const {
      retries = this.config.retries,
      retryOnStatuses = [429, 502, 503, 504],
      retryDelayMs = 400,
      backoffFactor = 2,
      jitter = true,
    } = retryOptions;

    let attempt = 0;
    let delay = retryDelayMs;

    while (true) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error: unknown) {
        attempt += 1;

        // Don't retry auth or abort (matching existing behavior exactly)
        if (error instanceof AuthenticationError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw error;

        // Retry for certain HTTP statuses - matching existing logic exactly
        if (
          error instanceof HttpError &&
          retryOnStatuses.includes(error.status) &&
          attempt <= retries
        ) {
          // Respect Retry-After for 429/503 if present
          let wait = delay;
          if (error.status === 429 || error.status === 503) {
            // We lost headers in HttpError; caller can pass headers in future if needed.
            // If you want header-aware wait, wrap at the apiRequest level below.
            // Fallback to computed delay.
          }
          if (jitter) {
            const jitterAmt = Math.random() * 0.3 + 0.85; // 0.85x–1.15x
            wait = Math.max(0, Math.round(delay * jitterAmt));
          }
          await sleep(wait);
          delay = delay * backoffFactor;
          continue;
        }

        // Retry transient network errors (not abort) up to limit - matching existing logic exactly
        const transient =
          !(error instanceof HttpError) &&
          error instanceof Error &&
          /network|fetch failed|load failed|TypeError/i.test(error.message);

        if (transient && attempt <= retries) {
          const wait = jitter
            ? Math.round(delay * (Math.random() * 0.3 + 0.85))
            : delay;
          await sleep(wait);
          delay = delay * backoffFactor;
          continue;
        }

        throw error;
      }
    }
  }

  /* =========================
     Convenience Methods
     ========================= */

  async get<T>(
    endpoint: string,
    options: Omit<HttpClientOptions, "method"> = {},
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /* =========================
     Configuration Methods
     ========================= */

  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = normalizeUrl(baseUrl);
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  setAuthTokenProvider(provider: () => string | null): void {
    this.config.authTokenProvider = provider;
  }

  setAuthErrorHandler(handler: (error: AuthenticationError) => void): void {
    this.config.onAuthError = handler;
  }

  /* =========================
     Logging Methods
     ========================= */

  private logApiRequest(method: string, url: string): void {
    // Import dynamically to avoid circular dependencies
    import("../security/secureLogger")
      .then(({ secureLogger }) => {
        // Replace UUIDs and numeric IDs with :id for logging
        const sanitizedUrl = url
          .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
          .replace(/\/\d+/g, "/:id");
        secureLogger.info(
          "API_REQUEST",
          `${method} ${sanitizedUrl}`,
        );
      })
      .catch(console.error);
  }

  private logApiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
  ): void {
    // Import dynamically to avoid circular dependencies
    import("../security/secureLogger")
      .then(({ secureLogger }) => {
        // Replace UUIDs and numeric IDs with :id for logging
        const sanitizedUrl = url
          .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
          .replace(/\/\d+/g, "/:id");
        const durationText = duration ? ` (${duration}ms)` : "";
        secureLogger.info(
          "API_RESPONSE",
          `${method} ${sanitizedUrl} - ${status}${durationText}`,
        );
      })
      .catch(console.error);
  }

  private handleAuthenticationError(error: AuthenticationError): void {
    // Import dynamically to avoid circular dependencies
    import("../security/secureLogger")
      .then(({ secureLogger }) => {
        secureLogger.security("AUTH", "Authentication error detected", {
          errorCode: error.errorCode,
          message: error.message,
        });
      })
      .catch(console.error);

    try {
      // With HTTP-only cookies, we need to call the server logout endpoint
      // But since we're already in an auth error state, just clear client state
      // The server will handle cookie clearing when user logs in again

      // Clear any legacy localStorage tokens for compatibility
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // No sessionStorage token cleanup needed - tokens are in HTTP-only cookies
    } catch {
      /* ignore */
    }

    // Notify app contexts/listeners
    try {
      const authErrorEvent = new CustomEvent("authenticationError", {
        detail: { errorCode: error.errorCode, message: error.message },
      });

      // Use setTimeout to ensure the event is dispatched asynchronously
      // This prevents the "message channel closed" error
      setTimeout(() => {
        try {
          window.dispatchEvent(authErrorEvent);
        } catch (dispatchError) {
          console.warn(
            "Authentication error event dispatch failed:",
            dispatchError,
          );
        }
      }, 0);
    } catch {
      /* ignore */
    }

    // Broadcast logout event to other tabs and redirect after brief delay
    try {
      const bc = new BroadcastChannel("auth");
      bc.postMessage({ type: "logout" });
      // It's okay to leave channel for GC
    } catch {
      /* ignore */
    }

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }, 100);
  }
}

/* =========================
   Abort Controller Utilities
   ========================= */

export function createAbortManager() {
  const controllers = new Set<AbortController>();

  const abortAll = () => {
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
  };

  const withAbort = async <T>(
    fn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      return await fn(controller.signal);
    } finally {
      controllers.delete(controller);
    }
  };

  return { abortAll, withAbort };
}
