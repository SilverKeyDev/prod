/* =========================
   HTTP Client Configuration Constants
   ========================= */

import { env } from './env';

/**
 * HTTP configuration constants
 */
export const HTTP_CONFIG = {
  // Default timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    AI_OPERATIONS: 300000, // 5 minutes for AI operations
    UPLOAD: 120000, // 2 minutes for file uploads
    DOWNLOAD: 60000, // 1 minute for downloads
  },

  // Retry configuration
  RETRY: {
    DEFAULT_ATTEMPTS: 2,
    MAX_ATTEMPTS: 5,
    BACKOFF_BASE: 1000, // Base delay in ms
    BACKOFF_MULTIPLIER: 2,
    JITTER_FACTOR: 0.1, // ±10% jitter
  },

  // Status codes that should trigger retries
  RETRY_STATUS_CODES: [429, 502, 503, 504],

  // Authentication error status codes
  AUTH_ERROR_CODES: [401, 403],

  // Request headers
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
    USER_AGENT: 'SilverKey-Client/1.0',
  },

  // API endpoints base paths
  API_PATHS: {
    AUTH: '/api/v1/auth',
    USER: '/api/v1/user',
    REPORTS: '/api/v1/report',
    SEARCH: '/api/v1/search',
    PREFERENCES: '/api/v1/preferences',
    OFFER: '/api/v1/offer',
    PAYMENT: '/api/v1/payment',
    UPLOAD: '/api/v1/upload',
  },

  // Request size limits
  LIMITS: {
    MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_CONCURRENT_REQUESTS: 10,
  },
} as const;

/**
 * HTTP Client configuration factory
 */
export class HttpConfigFactory {
  /**
   * Create default HTTP client configuration
   */
  static createDefault() {
    return {
      baseUrl: env.apiBaseUrl,
      timeout: env.apiTimeout,
      retries: env.apiRetries,
      headers: {
        'Content-Type': HTTP_CONFIG.HEADERS.CONTENT_TYPE,
        Accept: HTTP_CONFIG.HEADERS.ACCEPT,
        'User-Agent': HTTP_CONFIG.HEADERS.USER_AGENT,
      },
      retryStatusCodes: HTTP_CONFIG.RETRY_STATUS_CODES,
      authErrorCodes: HTTP_CONFIG.AUTH_ERROR_CODES,
    };
  }

  /**
   * Create configuration for AI operations (longer timeout)
   */
  static createForAI() {
    return {
      ...this.createDefault(),
      timeout: HTTP_CONFIG.TIMEOUTS.AI_OPERATIONS,
      retries: 1, // Fewer retries for expensive AI operations
    };
  }

  /**
   * Create configuration for file uploads
   */
  static createForUpload() {
    return {
      ...this.createDefault(),
      timeout: HTTP_CONFIG.TIMEOUTS.UPLOAD,
      headers: {
        // Don't set Content-Type for file uploads (let browser set multipart boundary)
        Accept: HTTP_CONFIG.HEADERS.ACCEPT,
        'User-Agent': HTTP_CONFIG.HEADERS.USER_AGENT,
      },
    };
  }

  /**
   * Create configuration for file downloads
   */
  static createForDownload() {
    return {
      ...this.createDefault(),
      timeout: HTTP_CONFIG.TIMEOUTS.DOWNLOAD,
      headers: {
        Accept: '*/*',
        'User-Agent': HTTP_CONFIG.HEADERS.USER_AGENT,
      },
    };
  }
}

/**
 * Utility functions for HTTP configuration
 */
export const httpUtils = {
  /**
   * Check if status code should trigger a retry
   */
  shouldRetry: (statusCode: number): boolean => {
    type RetryStatusCode = (typeof HTTP_CONFIG.RETRY_STATUS_CODES)[number];
    return HTTP_CONFIG.RETRY_STATUS_CODES.includes(statusCode as RetryStatusCode);
  },

  /**
   * Check if status code indicates authentication error
   */
  isAuthError: (statusCode: number): boolean => {
    type AuthErrorCode = (typeof HTTP_CONFIG.AUTH_ERROR_CODES)[number];
    return HTTP_CONFIG.AUTH_ERROR_CODES.includes(statusCode as AuthErrorCode);
  },

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateRetryDelay: (attempt: number): number => {
    const baseDelay =
      HTTP_CONFIG.RETRY.BACKOFF_BASE * Math.pow(HTTP_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);

    // Add jitter to prevent thundering herd
    const jitter = baseDelay * HTTP_CONFIG.RETRY.JITTER_FACTOR * (Math.random() - 0.5);

    return Math.max(1000, baseDelay + jitter); // Minimum 1 second delay
  },

  /**
   * Build full API URL
   */
  buildApiUrl: (path: string, params?: Record<string, string>): string => {
    const baseUrl = env.apiBaseUrl;
    const url = new URL(path, baseUrl ?? window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  },

  /**
   * Get API path for a service
   */
  getApiPath: (service: keyof typeof HTTP_CONFIG.API_PATHS): string => {
    return HTTP_CONFIG.API_PATHS[service];
  },
} as const;
