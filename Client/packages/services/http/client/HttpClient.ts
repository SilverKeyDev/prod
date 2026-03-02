import { log, LOG_CATEGORIES } from "packages/logger";
import { dateNow } from "packages/utils/date";
import { getDocument, getFetch } from "packages/utils/platform";

import { handle401Unauthorized, handleAuthenticationError, isAuthEndpoint } from "./auth";
import { AuthenticationError, HttpError } from "./errors";
import { logApiRequest, logApiResponse } from "./logging";
import type { HttpClientConfig as RequestHelpersConfig } from "./requestHelpers";
import { buildRequestOptions } from "./requestHelpers";
import { handleHttpResponse } from "./responseHandler";
import { normalizeUrl, sleep } from "./utils";

function getCookieNames(doc: Document | null): string[] {
  if (!doc) return [];
  return doc.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
}

function createRequestSignal(
  requestOptions: RequestInit,
  timeout: number
): {
  signal: AbortSignal;
  timeoutId: ReturnType<typeof setTimeout> | undefined;
} {
  if (requestOptions.signal) {
    return { signal: requestOptions.signal, timeoutId: undefined };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => {
      if (!controller.signal.aborted) {
        controller.abort(new Error("Request timeout"));
      }
    },
    Math.max(300000, timeout)
  );
  return { signal: controller.signal, timeoutId };
}

function sanitizeUrlForLog(url: string): string {
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
}

function formatNetworkErrorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) return JSON.stringify(error);
  return String(error);
}

function logNetworkError(method: string, url: string, error: unknown, duration: number): void {
  const sanitizedUrl = sanitizeUrlForLog(url);
  const errorType = error instanceof Error ? error.name : "Unknown";
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isTimeout =
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.message.includes("timeout") ||
      error.message.includes("aborted"));
  const isAbort = error instanceof Error && error.name === "AbortError";
  const isNetworkError =
    error instanceof Error &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("network") ||
      error.message.includes("CORS") ||
      error.message.includes("load failed"));

  log.error(LOG_CATEGORIES.HTTP, `${method} ${sanitizedUrl} - Network Error`, {
    method,
    url: sanitizedUrl,
    originalUrl: url,
    errorType,
    errorMessage,
    error: errorMessage,
    duration: `${duration}ms`,
    timestamp: dateNow().toISOString(),
    isTimeout,
    isAbort,
    isNetworkError,
    fullError: error,
  });
}

function isRetryableHttpError(error: unknown, retryOnStatuses: number[]): boolean {
  return error instanceof HttpError && retryOnStatuses.includes(error.status);
}

function isTransientNetworkError(error: unknown): boolean {
  return (
    !(error instanceof HttpError) &&
    error instanceof Error &&
    /network|fetch failed|load failed|TypeError/i.test(error.message)
  );
}

function computeRetryWaitMs(delay: number, jitter: boolean): number {
  if (!jitter) return delay;
  const jitterAmt = Math.random() * 0.3 + 0.85;
  return Math.max(0, Math.round(delay * jitterAmt));
}

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

  async request<T>(endpoint: string, options: HttpClientOptions = {}): Promise<T> {
    const timeout = options.timeout ?? this.config.timeout;
    const acceptStatuses = options.acceptStatuses ?? [];

    const { url, requestOptions, method, mergedHeaders } = buildRequestOptions(
      endpoint,
      options,
      this.config as RequestHelpersConfig
    );

    const startTime = Date.now();
    logApiRequest(method, url);

    const { signal, timeoutId } = createRequestSignal(requestOptions, timeout);

    try {
      const doc = getDocument();
      const allCookies = getCookieNames(doc);

      const response = await getFetch()(url, {
        ...requestOptions,
        signal,
      });

      if (response.status === 401 && !isAuthEndpoint(url)) {
        handle401Unauthorized(url);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const responseText = await response.text();
      const cookiesAfter = getCookieNames(doc);

      if (url.includes("/auth/") || response.status === 401) {
        log.debug(LOG_CATEGORIES.HTTP, "🔐 AUTH_RESPONSE_DETECTED", {
          url,
          status: response.status,
          cookiesBefore: allCookies,
          cookiesAfter,
          newCookies: cookiesAfter.filter((c) => !allCookies.includes(c)),
          corsOrigin: response.headers.get("access-control-allow-origin"),
          corsCredentials: response.headers.get("access-control-allow-credentials"),
        });
      }

      const responseData = handleHttpResponse<T>(
        response,
        responseText,
        contentType,
        url,
        acceptStatuses,
        mergedHeaders,
        requestOptions,
        method
      );

      const duration = Date.now() - startTime;
      logApiResponse(method, url, response.status, duration);
      return responseData;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      if (error instanceof HttpError) {
        logApiResponse(method, url, error.status, duration);
      } else if (error instanceof AuthenticationError) {
        logApiResponse(method, url, error.status, duration);
        handleAuthenticationError(error);
      } else {
        logNetworkError(method, url, error, duration);
      }

      if (error instanceof AuthenticationError) throw error;
      if (error instanceof HttpError) throw error;
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
      ) {
        throw error;
      }

      throw new Error(`Network error for ${url}: ${formatNetworkErrorDetail(error)}`);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  async requestWithRetry<T>(
    endpoint: string,
    options: HttpClientOptions = {},
    retryOptions: RetryOptions = {}
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

        if (error instanceof AuthenticationError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw error;

        const httpRetry = isRetryableHttpError(error, retryOnStatuses) && attempt <= retries;
        const networkRetry = isTransientNetworkError(error) && attempt <= retries;

        if (httpRetry || networkRetry) {
          await sleep(computeRetryWaitMs(delay, jitter));
          delay = delay * backoffFactor;
          continue;
        }

        throw error;
      }
    }
  }

  async get<T>(endpoint: string, options: Omit<HttpClientOptions, "method"> = {}): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, "method" | "body"> = {}
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
    options: Omit<HttpClientOptions, "method" | "body"> = {}
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
    options: Omit<HttpClientOptions, "method" | "body"> = {}
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
    options: Omit<HttpClientOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

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
}
