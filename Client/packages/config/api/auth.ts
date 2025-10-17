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
    log.info("AUTH_VERIFY_REQUEST", "Starting email verification request", {
      requestId,
      email: email
        ? `${email.substring(0, 3)}***${email.substring(email.length - 3)}`
        : "missing",
      codeLength: code?.length || 0,
      hasPassword: !!password,
      timestamp: new Date().toISOString(),
    });

    console.log("🔵 AUTH_VERIFY_API_CALL", {
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

      console.log("✅ AUTH_VERIFY_RESPONSE", {
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
        log.info("AUTH_VERIFY_SUCCESS", "Email verification successful", {
          requestId,
          verificationComplete: response.verification_complete,
          loginFailed: response.login_failed,
          duration: `${duration}ms`,
        });
      } else {
        log.warn("AUTH_VERIFY_FAILED", "Email verification failed", {
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

      console.error("❌ AUTH_VERIFY_ERROR", {
        requestId,
        errorType: err?.constructor?.name || "Unknown",
        errorMessage: err?.message || "Unknown error",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      log.error("AUTH_VERIFY_ERROR", "Verification request failed with exception", {
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
    log.info("AUTH_LOGIN_REQUEST", "Starting login request", {
      requestId,
      email: data.email
        ? `${data.email.substring(0, 3)}***${data.email.substring(data.email.length - 3)}`
        : "missing"
    });

    try {
      const apiUrl = "/api/v1/auth/login";
      const response = await apiPost<AuthResponse>(apiUrl, data);
      const duration = Date.now() - startTime;

      // Log successful response
      log.info("AUTH_LOGIN_SUCCESS", "Login successful", {
        requestId,
        duration: `${duration}ms`
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
      
      const sessionCookie = document.cookie
        .split(";")
        .find(c => c.trim().startsWith("session="));
      
      const refreshCookie = document.cookie
        .split(";")
        .find(c => c.trim().startsWith("refresh_token="));
      
      log.info("🔍 FRONTEND_VERIFY_SESSION_START", "Starting session verification", {
        requestId,
        allCookies,
        cookieCount: allCookies.length,
        hasSessionCookie: !!sessionCookie,
        hasRefreshCookie: !!refreshCookie,
        sessionCookiePreview: sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'none',
        refreshCookiePreview: refreshCookie ? refreshCookie.substring(0, 30) + '...' : 'none',
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      const { apiGet } = await import("../../services/http/compatibility");
      
      // Log the exact API call being made
      log.info("🔍 FRONTEND_VERIFY_API_CALL", "Making verify session API call", {
        requestId,
        url: "/api/v1/user/profile",
        method: "GET",
        includeCredentials: true,
        includeAuth: false,
        useCors: false
      });
      
      // Use profile endpoint to verify session
      const response = await apiGet<
        AuthResponse & { data?: Record<string, unknown> }
      >("/api/v1/user/profile", {
        includeCredentials: true,
        includeAuth: false,
        useCors: false,
      } as unknown as import("../../services/http/compatibility").ApiRequestOptions);

      // Log cookies after the response
      const cookiesAfter = document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      
      const newCookies = cookiesAfter.filter((c) => !allCookies.includes(c));

      if (response.success && response.data) {
        log.info("🔍 FRONTEND_VERIFY_SUCCESS", "Session verified successfully", {
          requestId,
          hasUserData: !!response.data,
          userEmail: (response.data as UserProfile)?.email ? 
            `${(response.data as UserProfile).email.substring(0, 3)}***${(response.data as UserProfile).email.substring((response.data as UserProfile).email.length - 3)}` : 
            'missing',
          cookiesAfter,
          newCookies,
          cookieCountAfter: cookiesAfter.length
        });
        return {
          success: true,
          user: response.data as UserProfile,
        };
      }

      log.info("🔍 FRONTEND_VERIFY_NO_SESSION", "No valid session found", {
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
      
      log.error("🔍 FRONTEND_VERIFY_ERROR", "Session verification failed with error", {
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
};
