import { apiPost } from "../../../services/http/compatibility";
import { HttpError } from "../../../services/http/compatibility";
import { reportSecurityEvent } from "../../../services/security/errorReporting";
import { log, LOG_CATEGORIES } from "../../../../logger";
import type { UserProfile } from "../../../schemas/auth/user";

// Types for authentication API
export type SignupData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agency_name?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   * The browser automatically sends tokens via cookies with credentials: "include".
   */
  access_token?: string;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   */
  id_token?: string;
  /**
   * @deprecated Tokens are stored in HTTP-only cookies by the backend.
   * These fields are returned for logging/debugging only and should NOT be stored client-side.
   */
  refresh_token?: string;
  user?:
    | UserProfile
    | {
        email: string;
        user_sub: string;
        name: string;
        id: string;
      };
  message?: string;
  error?: string;
  user_sub?: string;
  verification_complete?: boolean;
  login_failed?: boolean;
  auto_login_failed?: boolean;
  code_delivery?: unknown;
  needs_verification?: boolean;
};

/**
 * Authentication API client using centralized utilities
 */
export const authApi = {
  /**
   * Register a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>("/api/v1/auth/signup", data);

    if (response.success) {
      // Signup successful
    } else {
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "medium",
        description: "User signup failed",
        metadata: { email: data.email, error: response.error },
      });
    }

    return response;
  },

  /**
   * Resend verification code to user's email
   */
  resendCode: (email: string): Promise<AuthResponse> =>
    apiPost<AuthResponse>("/api/v1/auth/resend-code", { email }),

  /**
   * Verify user's email with verification code
   */
  verify: async (
    email: string,
    code: string,
    password: string,
  ): Promise<AuthResponse> => {
    const startTime = Date.now();
    const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log detailed verification request
    log.info(LOG_CATEGORIES.AUTH, "Starting email verification request", {
      requestId,
      email: email
        ? `${email.substring(0, 3)}***${email.substring(email.length - 3)}`
        : "missing",
      codeLength: code?.length || 0,
      hasPassword: !!password,
      timestamp: new Date().toISOString(),
    });

    log.debug(LOG_CATEGORIES.AUTH, "🔵 AUTH_VERIFY_API_CALL", {
      requestId,
      url: "/api/v1/auth/verify",
      method: "POST",
      email,
      codeLength: code?.length,
      hasPassword: !!password,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await apiPost<AuthResponse>("/api/v1/auth/verify", {
        email,
        code,
        password,
      });
      const duration = Date.now() - startTime;

      log.debug(LOG_CATEGORIES.AUTH, "✅ AUTH_VERIFY_RESPONSE", {
        requestId,
        success: response.success,
        verificationComplete: response.verification_complete,
        loginFailed: response.login_failed,
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      if (response.success) {
        log.info(LOG_CATEGORIES.AUTH, "Email verification successful", {
          requestId,
          verificationComplete: response.verification_complete,
          loginFailed: response.login_failed,
          duration: `${duration}ms`,
        });
      } else {
        log.warn(LOG_CATEGORIES.AUTH, "Email verification failed", {
          requestId,
          error: response.error,
          message: response.message,
          duration: `${duration}ms`,
        });

        reportSecurityEvent({
          type: "authentication_failure",
          severity: "medium",
          description: "Email verification failed",
          metadata: {
            email,
            error: response.error,
            requestId,
            duration: `${duration}ms`,
          },
        });
      }

      return response;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      log.error(LOG_CATEGORIES.AUTH, "❌ AUTH_VERIFY_ERROR", {
        requestId,
        errorType: err?.constructor?.name || "Unknown",
        errorMessage: err?.message || "Unknown error",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      log.error(LOG_CATEGORIES.AUTH, "Verification request failed with exception", {
        requestId,
        errorMessage: err?.message || "Unknown error",
        duration: `${duration}ms`,
      });

      reportSecurityEvent({
        type: "authentication_failure",
        severity: "high",
        description: "Email verification exception",
        metadata: {
          email,
          error: err?.message,
          requestId,
          duration: `${duration}ms`,
        },
      });

      throw error;
    }
  },

  /**
   * Authenticate user and return Cognito JWT tokens
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const startTime = Date.now();
    const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log only essential login request
    log.info(LOG_CATEGORIES.AUTH, "Starting login request", {
      requestId,
      email: data.email
        ? `${data.email.substring(0, 3)}***${data.email.substring(data.email.length - 3)}`
        : "missing"
    });

    try {
      const apiUrl = "/api/v1/auth/login";
      const response = await apiPost<AuthResponse>(apiUrl, data);
      const duration = Date.now() - startTime;

      // Only report authentication failure when the response explicitly indicates failure
      // Skip reporting if user just needs verification (expected behavior)
      if (!response.success && !response.needs_verification) {
        log.warn(LOG_CATEGORIES.AUTH, "Login request failed", {
          requestId,
          error: response.error,
          message: response.message,
          loginFailed: response.login_failed,
          duration: `${duration}ms`,
        });

        reportSecurityEvent({
          type: "authentication_failure",
          severity: response.login_failed ? "high" : "medium",
          description: "User login failed",
          metadata: {
            email: data.email,
            error: response.error,
            loginFailed: response.login_failed,
            requestId,
            duration: `${duration}ms`,
          },
        });
      } else if (response.needs_verification) {
        log.info(LOG_CATEGORIES.AUTH, "User needs email verification", {
          requestId,
          email: data.email
            ? `${data.email.substring(0, 3)}***${data.email.substring(data.email.length - 3)}`
            : "missing",
          duration: `${duration}ms`,
        });
      }

      return response;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = error as Error & { status?: string; errorCode?: string };

      // Check if this is an HttpError with needs_verification flag
      if (error instanceof HttpError && error.status === 401 && error.parsedBody) {
        const parsedBody = error.parsedBody as Record<string, unknown>;
        if (parsedBody.needs_verification === true) {
          log.info(LOG_CATEGORIES.AUTH, "User needs email verification", {
            requestId,
            email: data.email
              ? `${data.email.substring(0, 3)}***${data.email.substring(data.email.length - 3)}`
              : "missing",
            duration: `${duration}ms`,
          });

          // Return response indicating verification is needed
          return {
            success: false,
            error: parsedBody.error as string || "USER_NOT_VERIFIED",
            message: parsedBody.message as string || "Please verify your email address to continue.",
            needs_verification: true,
            code_delivery: parsedBody.code_delivery,
          };
        }

        // Extract actual error message from 401 response body
        const errorMessage = parsedBody.message as string || parsedBody.error as string || "Authentication failed";
        const errorCode = parsedBody.error as string || "AUTHENTICATION_FAILED";

        log.warn(LOG_CATEGORIES.AUTH, "Login failed with 401 error", {
          requestId,
          errorCode,
          errorMessage,
          duration: `${duration}ms`,
        });

        // Return response with actual error message from server
        return {
          success: false,
          error: errorCode,
          message: errorMessage,
        };
      }

      // Log detailed error information
      log.error(LOG_CATEGORIES.AUTH, "Login request failed with exception", {
        requestId,
        errorType: err?.constructor?.name || "Unknown",
        errorMessage: err?.message || "Unknown error",
        errorStatus: err?.status || "N/A",
        errorCode: err?.errorCode || "N/A",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        stack: err?.stack?.substring(0, 500) || "No stack trace",
      });

      // Check for specific error types
      type ErrorWithDetails = Error & {
        status?: string | number;
        errorCode?: string;
        bodyPreview?: string;
        url?: string;
      };
      const errWithDetails = err as ErrorWithDetails;

      if (errWithDetails?.status === "502" || errWithDetails?.status === 502) {
        log.error(LOG_CATEGORIES.AUTH, "Bad Gateway error during login", {
          requestId,
          errorDetails: {
            status: errWithDetails.status,
            message: errWithDetails.message,
            bodyPreview: errWithDetails.bodyPreview || "No body preview",
            url: errWithDetails.url || "Unknown URL",
          },
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });

        reportSecurityEvent({
          type: "authentication_failure",
          severity: "high",
          description: "Login failed due to server error (502 Bad Gateway)",
          metadata: {
            email: data.email,
            error: `HTTP ${errWithDetails.status} for ${errWithDetails.url}`,
            requestId,
            duration: `${duration}ms`,
            serverError: true,
          },
        });
      } else if (
        errWithDetails?.status &&
        typeof errWithDetails.status === "number" &&
        errWithDetails.status >= 500
      ) {
        log.error(LOG_CATEGORIES.AUTH, "Server error during login", {
          requestId,
          status: errWithDetails.status,
          message: errWithDetails.message,
          duration: `${duration}ms`,
        });
      } else if (
        errWithDetails?.status &&
        typeof errWithDetails.status === "number" &&
        errWithDetails.status >= 400
      ) {
        log.warn(LOG_CATEGORIES.AUTH, "Client error during login", {
          requestId,
          status: errWithDetails.status,
          message: errWithDetails.message,
          duration: `${duration}ms`,
        });
      }

      throw error;
    }
  },

  /**
   * Initiate forgot password flow
   */
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>(
      "/api/v1/auth/forgot-password",
      { email },
    );

    if (response.success) {
      // Password reset request successful
    } else {
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "low",
        description: "Password reset request failed",
        metadata: { email, error: response.error },
      });
    }

    return response;
  },

  /**
   * Confirm forgot password with code and set new password
   */
  resetPassword: async (
    email: string,
    code: string,
    new_password: string,
  ): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>(
      "/api/v1/auth/reset-password",
      {
        email,
        code,
        new_password,
      },
    );

    if (response.success) {
      log.security(LOG_CATEGORIES.AUTH, "Password reset successful", { email });
    } else {
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "medium",
        description: "Password reset confirmation failed",
        metadata: { email, error: response.error },
      });
    }

    return response;
  },

  /**
   * Logout user and clear HTTP-only cookies
   */
  logout: async (): Promise<AuthResponse> => {
    try {
      const response = await apiPost<AuthResponse>("/api/v1/auth/logout", {});

      if (response.success) {
        log.info(LOG_CATEGORIES.AUTH, "Logout successful - cookies cleared");
      } else {
        log.warn(LOG_CATEGORIES.AUTH, "Logout request failed", {
          error: response.error,
        });
      }

      return response;
    } catch (error: unknown) {
      const err = error as Error;
      log.error(LOG_CATEGORIES.AUTH, "Logout request failed with exception", {
        errorMessage: err?.message || "Unknown error",
      });
      // Return a generic error response
      return {
        success: false,
        error: "LOGOUT_FAILED",
        message: "Failed to logout",
      };
    }
  },

  /**
   * Verify current session using HTTP-only cookie
   * Always ask the server; do not rely on document.cookie heuristics
   */
  verifySession: async (): Promise<AuthResponse> => {
    const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log detailed cookie information before making the request
      const allCookies = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
    
      
      const { apiGet } = await import("../../../services/http/compatibility");
       
      // Use profile endpoint to verify session
      const response = await apiGet<
        AuthResponse & { data?: Record<string, unknown> }
      >("/api/v1/user/profile", {
        includeCredentials: true,
        includeAuth: false,
        useCors: false,
      } as unknown as import("../../../services/http/compatibility").ApiRequestOptions);

      // Log cookies after the response
      const cookiesAfter = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      
      const newCookies = cookiesAfter.filter((c) => !allCookies.includes(c));

      if (response.success && response.data) {
       
        return {
          success: true,
          user: response.data as UserProfile,
        };
      }

      log.info(LOG_CATEGORIES.AUTH, "🔍 No valid session found", {
        requestId,
        responseSuccess: response.success,
        hasData: !!response.data,
        cookiesAfter,
        newCookies,
        cookieCountAfter: cookiesAfter.length
      });
      return { success: false };
    } catch (error: unknown) {
      const err = error as Error;
      
      // Log cookies after error
      const cookiesAfterError = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      
      log.error(LOG_CATEGORIES.AUTH, "🔍 Session verification failed with error", {
        requestId,
        error: err?.message || "Unknown error",
        errorType: err?.constructor?.name || "Unknown",
        cookiesAfterError,
        cookieCountAfterError: cookiesAfterError.length,
        currentUrl: window.location.href
      });
      return { success: false };
    }
  },

  /**
   * Refresh access token using refresh token from HttpOnly cookie
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      log.info(LOG_CATEGORIES.AUTH, "Starting token refresh", {
        requestId,
      });

      const { apiPost } = await import("../../../services/http/compatibility");
      
      const response = await apiPost<AuthResponse>(
        "/api/v1/auth/refresh-token",
        {},
        {
          includeCredentials: true,
          includeAuth: false,
          useCors: false,
        } as unknown as import("../../../services/http/compatibility").ApiRequestOptions
      );

      if (response.success) {
        log.info(LOG_CATEGORIES.AUTH, "Token refresh successful", {
          requestId,
          hasUser: !!response.user,
        });
      } else {
        log.warn(LOG_CATEGORIES.AUTH, "Token refresh failed", {
          requestId,
          error: response.error,
          message: response.message,
        });

        // Report security event for refresh failures
        if (response.error === "REFRESH_TOKEN_EXPIRED" || response.error === "REFRESH_TOKEN_INVALID") {
          reportSecurityEvent({
            type: "authentication_failure",
            severity: "medium",
            description: "Token refresh failed - refresh token expired or invalid",
            metadata: {
              error: response.error,
              requestId,
            },
          });
        }
      }

      return response;
    } catch (error: unknown) {
      const err = error as Error;
      
      log.error(LOG_CATEGORIES.AUTH, "Token refresh request failed with exception", {
        requestId,
        error: err?.message || "Unknown error",
        errorType: err?.constructor?.name || "Unknown",
      });

      reportSecurityEvent({
        type: "authentication_failure",
        severity: "high",
        description: "Token refresh exception",
        metadata: {
          error: err?.message,
          requestId,
        },
      });

      return {
        success: false,
        error: "REFRESH_FAILED",
        message: "Failed to refresh token. Please log in again.",
      };
    }
  },
};
