/* =========================
   Fetch Utilities & Types
   ========================= */

import { HttpError, AuthenticationError, isAuthenticationError, handleAuthenticationError } from './errors';
import { logApiRequest, logApiResponse } from './logging';
import { getAuthToken, createAuthHeaders } from './auth';

type FetchJsonOpts = RequestInit & {
  acceptStatuses?: number[];
  timeout?: number;
};

type RetryOpts = {
  retries?: number;                 // default 2
  retryOnStatuses?: number[];       // default [429, 502, 503, 504]
  retryDelayMs?: number;            // base delay, default 400
  backoffFactor?: number;           // default 2
  jitter?: boolean;                 // default true
};

function toPlainHeaderObject(h?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (h instanceof Headers) {
    h.forEach((v, k) => (out[k] = v));
  } else if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v;
  } else {
    Object.assign(out, h as Record<string, string>);
  }
  return out;
}

/* =========================
   Low-level JSON Fetch
   ========================= */

/**
 * Robust fetch helper that handles HTML error pages and 404s gracefully.
 * Returns parsed JSON when content-type is JSON; otherwise returns `undefined`
 * only if body is empty or status is explicitly accepted.
 */
export async function fetchJson<T>(url: string, opts: FetchJsonOpts = {}): Promise<T> {
  const { acceptStatuses = [], timeout = 30000, ...init } = opts;
  const startTime = Date.now();

  // Log request
  const method = (init.method || 'GET').toUpperCase();
  
  logApiRequest(method, url);

  // Add timeout support - only create new controller if no signal provided
  let controller: AbortController | undefined;
  let timer: NodeJS.Timeout | undefined;
  let signal: AbortSignal;
  
  if (init.signal) {
    // Use existing signal if provided
    signal = init.signal;
  } else {
    // Create new controller with timeout
    controller = new AbortController();
    timer = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        controller.abort(new Error('Request timeout'));
      }
    }, Math.max(300000, timeout)); // Minimum 5 minute timeout for AI operations
    signal = controller.signal;
  }

  try {
    const res = await fetch(url, { ...init, signal });

    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();

    // Non-OK handling (unless caller opted-in via acceptStatuses)
    if (!res.ok && !acceptStatuses.includes(res.status)) {
      let parsedBody: any;
      try {
        if (contentType.includes('application/json') && raw.trim()) {
          parsedBody = JSON.parse(raw);

          // Auth errors that should trigger logout
          if (res.status === 401 && parsedBody?.error) {
            const authErrorCodes = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED', 'NO_TOKEN'];
            if (authErrorCodes.includes(parsedBody.error)) {
              throw new AuthenticationError(
                parsedBody.error,
                parsedBody.message || 'Authentication required',
                res.status
              );
            }
          }
        }
      } catch (parseErr) {
        if (parseErr instanceof AuthenticationError) throw parseErr;
        // fallthrough: treat as non-JSON error page
      }
      throw new HttpError(res.status, url, raw.slice(0, 600), parsedBody);
    }

    // Handle non-JSON responses
    if (!contentType.includes('application/json')) {
      if (acceptStatuses.includes(res.status) || raw.trim() === '') {
        return undefined as unknown as T;
      }
      throw new Error(
        `Expected JSON from ${url} but got ${contentType || 'unknown type'}. Body: ${raw.slice(0, 200)}`
      );
    }

    // Parse and return JSON
    try {
      const responseData = JSON.parse(raw) as T;
      const duration = Date.now() - startTime;
      logApiResponse(method, url, res.status, duration);
      return responseData;
    } catch {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, res.status, duration);
      throw new Error(`Invalid JSON from ${url}. Body: ${raw.slice(0, 200)}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error responses
    if (error instanceof HttpError) {
      logApiResponse(method, url, error.status, duration);
    } else if (error instanceof AuthenticationError) {
      logApiResponse(method, url, error.status, duration);
    } else {
      console.error('API_REQUEST', `${method} ${url} - Network Error`, {
        method,
        url: url.replace(/\/\d+/g, '/:id'),
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
    // Re-throw known types / aborts as-is
    if (error instanceof AuthenticationError) throw error;
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) throw error;

    // Wrap other errors
    throw new Error(`Network error for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/* =========================
   Retry Wrapper
   ========================= */

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchJsonWithRetry<T>(
  url: string,
  init: FetchJsonOpts,
  retry: RetryOpts = {}
): Promise<T> {
  const {
    retries = 2,
    retryOnStatuses = [429, 502, 503, 504],
    retryDelayMs = 400,
    backoffFactor = 2,
    jitter = true,
  } = retry;

  let attempt = 0;
  let delay = retryDelayMs;

  while (true) {
    try {
      return await fetchJson<T>(url, init);
    } catch (err) {
      attempt += 1;

      // Don't retry auth or abort
      if (err instanceof AuthenticationError) throw err;
      if (err instanceof Error && err.name === 'AbortError') throw err;

      // Retry for certain HTTP statuses
      if (err instanceof HttpError && retryOnStatuses.includes(err.status) && attempt <= retries) {
        // Respect Retry-After for 429/503 if present
        let wait = delay;
        if (err.status === 429 || err.status === 503) {
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

      // Retry transient network errors (not abort) up to limit
      const transient =
        !(err instanceof HttpError) &&
        err instanceof Error &&
        /network|fetch failed|load failed|TypeError/i.test(err.message);

      if (transient && attempt <= retries) {
        const wait = jitter ? Math.round(delay * (Math.random() * 0.3 + 0.85)) : delay;
        await sleep(wait);
        delay = delay * backoffFactor;
        continue;
      }

      throw err;
    }
  }
}

/* =========================
   AbortController Utilities
   ========================= */

export function createAbortManager() {
  const controllers = new Set<AbortController>();

  const abortAll = () => {
    controllers.forEach((c) => c.abort());
    controllers.clear();
  };

  const withAbort = async <T,>(fn: (signal: AbortSignal) => Promise<T>) => {
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

/* =========================
   Types & Interfaces
   ========================= */

export interface ApiRequestOptions extends RequestInit, RetryOpts {
  includeCredentials?: boolean; // default true
  includeAuth?: boolean;        // default true
  authToken?: string;
  acceptStatuses?: number[];
  timeout?: number;             // default 30000
  useCors?: boolean;            // default true
  baseUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/* =========================
   Configuration
   ========================= */

const normalizeBase = (s: string) => s.replace(/\/+$/, '');

const getBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_BASE_URL;
  return normalizeBase(env || '');
};

/* =========================
   Core API Request Function
   ========================= */

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
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

  // Construct full URL (avoid double slashes)
  const base = normalizeBase(baseUrl || getBaseUrl());
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Get auth token & build headers
  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const mergedHeaders = {
    ...createAuthHeaders(token),
    ...toPlainHeaderObject(fetchOptions.headers),
  };

  // Build request options
  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers: mergedHeaders,
    mode: useCors ? 'cors' : fetchOptions.mode,
    credentials: includeCredentials ? 'include' : fetchOptions.credentials,
  };

  try {
    // retry wrapper around fetchJson
    return await fetchJsonWithRetry<T>(
      url,
      { ...requestOptions, acceptStatuses, timeout },
      { retries, retryOnStatuses, retryDelayMs, backoffFactor, jitter }
    );
  } catch (error) {
    if (isAuthenticationError(error)) {
      handleAuthenticationError(error as AuthenticationError);
      throw error;
    }
    throw error;
  }
}
