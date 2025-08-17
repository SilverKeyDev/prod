/* =========================
   Robust Fetch Utilities
   ========================= */

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public bodyPreview: string
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

type FetchJsonOpts = RequestInit & { 
  acceptStatuses?: number[];
  timeout?: number;
};

/**
 * Robust fetch helper that handles HTML error pages and 404s gracefully
 */
export async function fetchJson<T>(url: string, opts: FetchJsonOpts = {}): Promise<T> {
  const { acceptStatuses = [], timeout = 30000, ...init } = opts;
  
  // Add timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, { 
      ...init, 
      signal: init.signal || controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();

    // Handle non-OK responses
    if (!res.ok && !acceptStatuses.includes(res.status)) {
      throw new HttpError(res.status, url, raw.slice(0, 600));
    }

    // Handle non-JSON responses
    if (!contentType.includes('application/json')) {
      // Allow "no JSON" when caller accepts the status or response is empty
      if (acceptStatuses.includes(res.status) || raw.trim() === '') {
        return undefined as unknown as T;
      }
      throw new Error(
        `Expected JSON from ${url} but got ${contentType}. Body: ${raw.slice(0, 200)}`
      );
    }

    // Parse and return JSON
    try {
      return JSON.parse(raw) as T;
    } catch (parseError) {
      throw new Error(
        `Invalid JSON from ${url}. Body: ${raw.slice(0, 200)}`
      );
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Re-throw AbortError as-is
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    
    // Re-throw HttpError as-is
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Wrap other errors
    throw new Error(`Network error for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Logs HTTP errors in a user-friendly way
 */
export function logHttp(scope: string, e: unknown) {
  if (e instanceof HttpError) {
    console.warn(`[${scope}] ${e.message}`, { 
      status: e.status, 
      url: e.url, 
      body: e.bodyPreview 
    });
  } else if (e instanceof Error && e.name === 'AbortError') {
    console.debug(`[${scope}] Request aborted`);
  } else {
    console.error(`[${scope}] Unexpected error:`, e);
  }
}

/* =========================
   Route Utilities
   ========================= */

/**
 * Check if current route starts with a given prefix
 */
export const routeStartsWith = (prefix: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(prefix);
};

/**
 * Check if current route matches any of the given prefixes
 */
export const routeMatchesAny = (prefixes: string[]): boolean => {
  return prefixes.some(prefix => routeStartsWith(prefix));
};

/* =========================
   Auth Utilities
   ========================= */

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('id_token');
}

/**
 * Create auth headers for API requests
 */
export function createAuthHeaders(token?: string | null): HeadersInit {
  const authToken = token || getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
  };
}

/* =========================
   AbortController Utilities
   ========================= */

/**
 * Create an abort manager for handling multiple concurrent requests
 */
export function createAbortManager() {
  const controllers = new Set<AbortController>();
  
  const abortAll = () => {
    controllers.forEach((c) => c.abort());
    controllers.clear();
  };
  
  const withAbort = <T,>(fn: (signal: AbortSignal) => Promise<T>) => {
    const controller = new AbortController();
    controllers.add(controller);
    return fn(controller.signal).finally(() => controllers.delete(controller));
  };
  
  return { abortAll, withAbort };
}

/**
 * Check if an error is an AbortError
 */
export function isAbortError(error: any): boolean {
  return error?.name === "AbortError";
}
