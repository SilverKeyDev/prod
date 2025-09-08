/* =========================
   Error Classes & Handling
   ========================= */

import { log } from '../../lib/security/secureLogger';

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

export function logHttp(scope: string, e: unknown) {
  if (e instanceof AuthenticationError) {
    log.security(scope, `Authentication error: ${e.errorCode}`, { message: e.message });
  } else if (e instanceof HttpError) {
    log.warn(scope, `HTTP ${e.status} error`, {
      status: e.status,
      url: e.url,
      body: e.bodyPreview,
    });
  } else if (e instanceof Error && e.name === 'AbortError') {
    log.debug(scope, 'Request aborted');
  } else {
    log.error(scope, 'Unexpected HTTP error', e);
  }
}

export function isAuthenticationError(error: any): boolean {
  return error instanceof AuthenticationError;
}

export function handleAuthenticationError(error: AuthenticationError) {
  log.security('AUTH', 'Authentication error detected', { 
    errorCode: error.errorCode, 
    message: error.message 
  });

  try {
    // Clear all possible token storage locations securely
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear secure auth hook tokens if available
    if ((window as any).clearSecureTokens) {
      (window as any).clearSecureTokens();
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

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}
