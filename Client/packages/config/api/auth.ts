import { apiPost } from "../../services/http/compatibility";
import { reportSecurityEvent } from "../../services/security/errorReporting";
import { log } from "../../services/security/secureLogger";
import type { UserProfile } from "../../schemas/user";

// Types for authentication API
export type SignupData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agency_name?: string;
};

export type VerifyData = {
  email: string;
  code: string;
  password: string;
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
   * Verify user's email with code and automatically log them in
   */
  verify: async (data: VerifyData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>("/api/v1/auth/verify", data);

    if (response.success && response.verification_complete) {
      // Verification successful
    } else {
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "medium",
        description: "Email verification failed",
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
   * Authenticate user and return Cognito JWT tokens
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const startTime = Date.now();
    const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log detailed request information
    log.info("AUTH_LOGIN_REQUEST", "Starting login request", {
      requestId,
      email: data.email
        ? `${data.email.substring(0, 3)}***${data.email.substring(data.email.length - 3)}`
        : "missing",
      hasPassword: !!data.password,
      passwordLength: data.password?.length || 0,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    try {
      // Get cookies BEFORE the login request
      const cookiesBefore = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);

      // Log the exact API call being made with detailed info
      const apiUrl = "/api/v1/auth/login";
      console.log("🔵 AUTH_LOGIN_API_CALL", {
        requestId,
        url: apiUrl,
        fullUrl: window.location.origin + apiUrl,
        method: "POST",
        hasCredentials: true,
        contentType: "application/json",
        currentOrigin: window.location.origin,
        currentHref: window.location.href,
        cookiesBefore,
        cookieCountBefore: cookiesBefore.length,
      });

      const response = await apiPost<AuthResponse>(apiUrl, data);
      const duration = Date.now() - startTime;

      // Get cookies AFTER the login response
      const cookiesAfter = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      const newCookies = cookiesAfter.filter((c) => !cookiesBefore.includes(c));

      // Log successful response with cookie details
      console.log("✅ AUTH_LOGIN_SUCCESS", {
        requestId,
        success: response.success,
        hasAccessToken: !!response.access_token,
        hasIdToken: !!response.id_token,
        hasRefreshToken: !!response.refresh_token,
        hasUser: !!response.user,
        duration: `${duration}ms`,
        cookiesBefore,
        cookiesAfter,
        newCookies,
        cookieCountBefore: cookiesBefore.length,
        cookieCountAfter: cookiesAfter.length,
        timestamp: new Date().toISOString(),
      });

      // Only report authentication failure when the response explicitly indicates failure
      if (!response.success) {
        log.warn("AUTH_LOGIN_FAILED", "Login request failed", {
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
      }

      return response;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = error as Error & { status?: string; errorCode?: string };

      // Log detailed error information
      log.error("AUTH_LOGIN_ERROR", "Login request failed with exception", {
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
        log.error("AUTH_LOGIN_502_ERROR", "Bad Gateway error during login", {
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
        log.error("AUTH_LOGIN_SERVER_ERROR", "Server error during login", {
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
        log.warn("AUTH_LOGIN_CLIENT_ERROR", "Client error during login", {
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
      log.security("AUTH_API", "Password reset successful", { email });
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
        log.info("AUTH_LOGOUT", "Logout successful - cookies cleared");
      } else {
        log.warn("AUTH_LOGOUT_FAILED", "Logout request failed", {
          error: response.error,
        });
      }

      return response;
    } catch (error: unknown) {
      const err = error as Error;
      log.error("AUTH_LOGOUT_ERROR", "Logout request failed with exception", {
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
   */
  verifySession: async (): Promise<AuthResponse> => {
    try {
      // Import apiGet from compatibility
      const { apiGet } = await import("../../services/http/compatibility");

      const response = await apiGet<
        AuthResponse & { data?: Record<string, unknown> }
      >("/api/v1/user/profile");

      if (response.success && response.data) {
        log.info("AUTH_SESSION_VERIFY", "Session verified successfully");
        return {
          success: true,
          user: response.data as UserProfile,
        };
      }

      return { success: false };
    } catch (error: unknown) {
      const err = error as Error;
      log.debug("AUTH_SESSION_VERIFY_FAILED", "Session verification failed", {
        error: err?.message || "Unknown error",
      });
      return { success: false };
    }
  },
};
