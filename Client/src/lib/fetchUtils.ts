/* =========================
   Robust Fetch Utilities
   ========================= */

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public bodyPreview: string,
    public parsedBody?: any
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

export class AuthenticationError extends Error {
  constructor(
    public errorCode: string,
    public message: string,
    public status: number
  ) {
    super(`Authentication error: ${errorCode} - ${message}`);
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
      // Try to parse JSON to check for authentication errors
      let parsedBody;
      try {
        if (contentType.includes('application/json') && raw.trim()) {
          parsedBody = JSON.parse(raw);
          
          // Check for authentication errors that should trigger logout
          if (res.status === 401 && parsedBody?.error) {
            const authErrorCodes = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED'];
            if (authErrorCodes.includes(parsedBody.error)) {
              throw new AuthenticationError(
                parsedBody.error,
                parsedBody.message || 'Authentication required',
                res.status
              );
            }
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, continue with regular HttpError
        if (parseError instanceof AuthenticationError) {
          throw parseError;
        }
      }
      
      throw new HttpError(res.status, url, raw.slice(0, 600), parsedBody);
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
    
    // Re-throw AuthenticationError as-is
    if (error instanceof AuthenticationError) {
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
  if (e instanceof AuthenticationError) {
    console.warn(`[${scope}] Authentication error: ${e.errorCode} - ${e.message}`);
  } else if (e instanceof HttpError) {
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

/**
 * Checks if an error is an authentication error that should trigger logout
 */
export function isAuthenticationError(error: any): boolean {
  return error instanceof AuthenticationError;
}

/**
 * Handles authentication errors by clearing tokens and redirecting to login
 */
export function handleAuthenticationError(error: AuthenticationError) {
  console.warn(`🔒 Authentication error detected: ${error.errorCode} - ${error.message}`);
  
  // Clear all auth tokens
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  
  // Dispatch custom event for contexts to handle
  window.dispatchEvent(new CustomEvent('authenticationError', {
    detail: { errorCode: error.errorCode, message: error.message }
  }));
  
  // Redirect to login after a brief delay to allow cleanup
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, 100);
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
