/* =========================
   HTTP Client Foundation
   ========================= */

// Pure HTTP client with no React dependencies
// Handles retry, timeout, error handling, and authentication
// Import existing logging and error utilities for compatibility

// Import auth token directly to avoid circular dependencies
// Note: getAuthToken will be used by the configured client in config.ts
import { asError } from '../../utils/error';

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
    public parsedBody?: unknown
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

// Match existing AuthenticationError structure exactly
export class AuthenticationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public status: number
  ) {
    super(`Authentication error: ${errorCode} - ${message}`);
    this.name = 'AuthenticationError';
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/* =========================
   Utility Functions
   ========================= */

// Centralized header normalization
export function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
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
  return base.replace(/\/+$/, '');
}

// Centralized auth headers creation
export function createAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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
      baseUrl: config.baseUrl ?? '',
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 2,
      authTokenProvider: config.authTokenProvider ?? (() => null),
      onAuthError: config.onAuthError ?? (() => {}),
    };
  }

  /* =========================
     Low-level Request Method
     ========================= */

  async request<T>(endpoint: string, options: HttpClientOptions = {}): Promise<T> {
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
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    // Get auth token
    const token = authToken ?? (includeAuth ? this.config.authTokenProvider() : null);

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
      mode: useCors ? 'cors' : fetchOptions.mode,
      credentials: includeCredentials ? 'include' : fetchOptions.credentials,
    };

    // Log request
    const method = (requestOptions.method ?? 'GET').toUpperCase();
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
            controller.abort(new Error('Request timeout'));
          }
        },
        Math.max(300000, timeout)
      ); // Minimum 5 minutes for AI operations
      ({ signal } = controller);
    }

    try {
      // Log detailed request information before making the request
      console.log('HTTP_REQUEST_DETAILS', {
        method,
        url,
        headers: Object.keys(mergedHeaders),
        hasBody: !!requestOptions.body,
        bodyType: requestOptions.body ? typeof requestOptions.body : 'none',
        bodyLength: requestOptions.body ? String(requestOptions.body).length : 0,
        credentials: requestOptions.credentials,
        mode: requestOptions.mode,
        signal: !!signal,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(url, {
        ...requestOptions,
        signal,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const responseText = await response.text();

      // Log detailed response information
      console.log('HTTP_RESPONSE_DETAILS', {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      // Handle non-OK responses
      if (!response.ok && !acceptStatuses.includes(response.status)) {
        let parsedBody: unknown;

        try {
          if (contentType.includes('application/json') && responseText.trim()) {
            parsedBody = JSON.parse(responseText);

            // Check for authentication errors
            if (response.status === 401 && parsedBody && typeof parsedBody === 'object' && 'error' in parsedBody) {
              const authErrorCodes = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED', 'NO_TOKEN'];
              const errorBody = parsedBody as { error: string; message?: string };
              if (authErrorCodes.includes(errorBody.error)) {
                const authError = new AuthenticationError(
                  errorBody.error,
                  errorBody.message ?? 'Authentication required',
                  response.status
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
          console.error('HTTP_502_BAD_GATEWAY', {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            responseText: responseText,
            parsedBody,
            headers: Object.fromEntries(response.headers.entries()),
            requestHeaders: mergedHeaders,
            timestamp: new Date().toISOString()
          });
        }

        throw new HttpError(response.status, url, responseText.slice(0, 600), parsedBody);
      }

      // Handle non-JSON responses
      if (!contentType.includes('application/json')) {
        if (acceptStatuses.includes(response.status) ?? responseText.trim() === '') {
          return undefined as unknown as T;
        }
        throw new Error(
          `Expected JSON from ${url} but got ${contentType ?? 'unknown type'}. Body: ${responseText.slice(0, 200)}`
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
        throw new Error(`Invalid JSON from ${url}. Body: ${responseText.slice(0, 200)}`);
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
        console.error('API_REQUEST', `${method} ${url} - Network Error`, {
          method,
          url: url.replace(/\/\d+/g, '/:id'),
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      }

      // Re-throw known types / aborts as-is (matching existing behavior)
      if (error instanceof AuthenticationError) throw error;
      if (error instanceof HttpError) throw error;
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
        throw error;

      // Wrap other errors
      throw new Error(
        `Network error for ${url}: ${error instanceof Error ? error.message : typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)}`
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

        // Don't retry auth or abort (matching existing behavior exactly)
        if (error instanceof AuthenticationError) throw error;
        if (error instanceof Error && error.name === 'AbortError') throw error;

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
          const wait = jitter ? Math.round(delay * (Math.random() * 0.3 + 0.85)) : delay;
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

  async get<T>(endpoint: string, options: Omit<HttpClientOptions, 'method'> = {}): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<HttpClientOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'DELETE',
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
    import('../security/secureLogger')
      .then(({ secureLogger }) => {
        secureLogger.info('API_REQUEST', `${method} ${url.replace(/\/\d+/g, '/:id')}`);
      })
      .catch(console.error);
  }

  private logApiResponse(method: string, url: string, status: number, duration?: number): void {
    // Import dynamically to avoid circular dependencies
    import('../security/secureLogger')
      .then(({ secureLogger }) => {
        const durationText = duration ? ` (${duration}ms)` : '';
        secureLogger.info(
          'API_RESPONSE',
          `${method} ${url.replace(/\/\d+/g, '/:id')} - ${status}${durationText}`
        );
      })
      .catch(console.error);
  }

  private handleAuthenticationError(error: AuthenticationError): void {
    // Import dynamically to avoid circular dependencies
    import('../security/secureLogger')
      .then(({ secureLogger }) => {
        secureLogger.security('AUTH', 'Authentication error detected', {
          errorCode: error.errorCode,
          message: error.message,
        });
      })
      .catch(console.error);

    try {
      // Clear all possible token storage locations securely
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('id_token');
      sessionStorage.removeItem('user');
      // Clear legacy localStorage tokens for compatibility
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Clear secure auth hook tokens if available
      if ((window as unknown as { clearSecureTokens?: () => void }).clearSecureTokens) {
        (window as unknown as { clearSecureTokens: () => void }).clearSecureTokens();
      }
    } catch {
      /* ignore */
    }

    // Notify app contexts/listeners
    try {
      window.dispatchEvent(
        new CustomEvent('authenticationError', {
          detail: { errorCode: error.errorCode, message: error.message },
        })
      );
    } catch {
      /* ignore */
    }

    // Redirect to login after a brief delay to allow cleanup
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
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

  const withAbort = async <T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> => {
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
