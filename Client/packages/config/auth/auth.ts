/* =========================
   Authentication Configuration Constants
   ========================= */

import { log } from "packages/logger";
import { getLocalStorage, getSessionStorage } from "packages/utils/core/storage/platformStorage";

/**
 * Authentication configuration that matches existing patterns
 * Uses the same structure as existing auth implementations
 */

// Define enums here to avoid circular imports
export enum AuthStatus {
  IDLE = "idle",
  LOADING = "loading",
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  ERROR = "error",
}

export enum AuthEvents {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  TOKEN_REFRESH = "token_refresh",
  SESSION_EXPIRED = "session_expired",
  UNAUTHORIZED = "unauthorized",
}

/**
 * Authentication-related constants and configuration
 * Matches the structure expected by existing auth implementations
 */
export const AUTH_CONFIG = {
  // Storage Keys (lowercase to match existing usage)
  // NOTE: With HTTP-only cookie authentication, token keys are NEVER used.
  // Tokens are stored exclusively in HTTP-only cookies set by the backend.
  STORAGE_KEYS: {
    /**
     * @deprecated Not used with HTTP-only cookies. Kept for backward compatibility only.
     */
    ACCESS_TOKEN: "access_token",
    /**
     * @deprecated Not used with HTTP-only cookies. Kept for backward compatibility only.
     */
    REFRESH_TOKEN: "refresh_token",
    /**
     * @deprecated Not used with HTTP-only cookies. Kept for backward compatibility only.
     */
    ID_TOKEN: "id_token",
    USER: "user", // ✅ Used for non-sensitive user data
    USER_PROFILE: "userProfile", // ✅ Used for non-sensitive profile data
  },

  // Secure Storage Configuration
  SECURE_STORAGE: {
    // Use sessionStorage for sensitive data (auth state)
    SENSITIVE_STORAGE: "sessionStorage",
    // Use localStorage for non-sensitive data (preferences, UI state)
    NON_SENSITIVE_STORAGE: "localStorage",
    // Keys that should NEVER be stored in localStorage
    FORBIDDEN_LOCALSTORAGE_KEYS: [
      "access_token",
      "refresh_token",
      "id_token",
      "password",
      "signupPassword",
      "signupEmail", // Contains PII
      "user", // Contains sensitive user data
      "userProfile", // Contains sensitive user data
    ],
  },

  /**
   * @deprecated Token refresh is handled by HTTP-only cookies on the backend.
   * Client-side token refresh is not needed. Kept for backward compatibility only.
   */
  TOKEN_REFRESH: {
    REFRESH_INTERVAL: 14 * 60 * 1000,
    CHECK_INTERVAL: 5 * 60 * 1000,
    EXPIRY_BUFFER_MINUTES: 5,
  },

  // Session Management (used by useSessionTimeout)
  SESSION: {
    // Session timeout warning (25 minutes in milliseconds)
    TIMEOUT_WARNING: 25 * 60 * 1000,
    // Maximum session duration (8 hours in milliseconds) - matches backend token expiry
    MAX_DURATION: 8 * 60 * 60 * 1000,
    // Grace period for user interaction (5 minutes in milliseconds)
    GRACE_PERIOD: 5 * 60 * 1000,
  },

  // API Endpoints (lowercase to match existing usage)
  endpoints: {
    signup: "/api/v1/auth/signup",
    resendCode: "/api/v1/auth/resend-code",
    login: "/api/v1/auth/login",
    forgotPassword: "/api/v1/auth/forgot-password",
    resetPassword: "/api/v1/auth/reset-password",
    refreshToken: "/api/v1/auth/refresh-token",
    logout: "/api/v1/auth/logout",
  },

  // Authentication Error Codes
  ERROR_CODES: {
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    INVALID_TOKEN: "INVALID_TOKEN",
    UNAUTHORIZED: "UNAUTHORIZED",
    NO_TOKEN: "NO_TOKEN",
    REFRESH_FAILED: "REFRESH_FAILED",
    LOGIN_REQUIRED: "LOGIN_REQUIRED",
  },

  // Security Configuration
  SECURITY: {
    // Maximum login attempts before lockout
    MAX_LOGIN_ATTEMPTS: 5,
    // Lockout duration in milliseconds (15 minutes)
    LOCKOUT_DURATION: 15 * 60 * 1000,
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SYMBOLS: true,
  },

  // Routes that don't require authentication
  PUBLIC_ROUTES: [
    "/",
    "/login",
    "/signup",
    "/verification",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/agent-profile",
    "/a",
    "/property",
  ],

  // Routes that require authentication
  PROTECTED_ROUTES: [
    "/dashboard",
    "/find-agents",
    "/search",
    "/library",
    "/saved",
    "/past-reports",
    "/compare-reports",
    "/saved-homes",
    "/profile",
    "/generate-report",
    "/onboarding",
    "/offer-draft",
    "/negotiation",
    "/client-intel",
    "/admin",
  ],

  // Default redirect routes
  REDIRECTS: {
    AFTER_LOGIN: "/search",
    AFTER_LOGOUT: "/login",
    AFTER_SIGNUP: "/verification",
    AFTER_VERIFICATION: "/search",
    AFTER_ONBOARDING: "/search",
    UNAUTHORIZED: "/login",
  },
} as const;

/**
 * User role constants
 */
export enum UserRole {
  USER = "user",
  AGENT = "agent",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

/**
 * Permission constants for role-based access control
 */
export const PERMISSIONS = {
  // User permissions
  VIEW_DASHBOARD: "view_dashboard",
  GENERATE_REPORTS: "generate_reports",
  VIEW_REPORTS: "view_reports",
  SAVE_HOMES: "save_homes",
  UPDATE_PREFERENCES: "update_preferences",

  // Agent permissions
  VIEW_CLIENTS: "view_clients",
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENT_REPORTS: "view_client_reports",
  GENERATE_CLIENT_REPORTS: "generate_client_reports",

  // Admin permissions
  MANAGE_USERS: "manage_users",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SYSTEM: "manage_system",

  // Super admin permissions
  FULL_ACCESS: "full_access",
} as const;

/**
 * Role-based permission mapping
 */
const USER_PERMISSIONS = [
  PERMISSIONS.VIEW_DASHBOARD,
  PERMISSIONS.GENERATE_REPORTS,
  PERMISSIONS.VIEW_REPORTS,
  PERMISSIONS.SAVE_HOMES,
  PERMISSIONS.UPDATE_PREFERENCES,
];

const AGENT_PERMISSIONS = [
  ...USER_PERMISSIONS,
  PERMISSIONS.VIEW_CLIENTS,
  PERMISSIONS.MANAGE_CLIENTS,
  PERMISSIONS.VIEW_CLIENT_REPORTS,
  PERMISSIONS.GENERATE_CLIENT_REPORTS,
];

const ADMIN_PERMISSIONS = [
  ...AGENT_PERMISSIONS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.VIEW_ANALYTICS,
  PERMISSIONS.MANAGE_SYSTEM,
];

export const ROLE_PERMISSIONS = {
  [UserRole.USER]: USER_PERMISSIONS,
  [UserRole.AGENT]: AGENT_PERMISSIONS,
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPER_ADMIN]: [PERMISSIONS.FULL_ACCESS],
} as const;

/**
 * Utility functions for authentication configuration
 */
export const authUtils = {
  /**
   * Check if a route is public (doesn't require authentication)
   */
  isPublicRoute: (path: string): boolean => {
    return AUTH_CONFIG.PUBLIC_ROUTES.some(
      (route) => path === route || path.startsWith(`${route}/`)
    );
  },

  /**
   * Check if a route is protected (requires authentication)
   */
  isProtectedRoute: (path: string): boolean => {
    return AUTH_CONFIG.PROTECTED_ROUTES.some(
      (route) => path === route || path.startsWith(`${route}/`)
    );
  },

  /**
   * Get redirect URL after authentication action
   */
  getRedirectUrl: (action: keyof typeof AUTH_CONFIG.REDIRECTS): string => {
    return AUTH_CONFIG.REDIRECTS[action];
  },

  /**
   * Check if user has permission
   */
  hasPermission: (userRole: UserRole, permission: string): boolean => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] as readonly string[];
    // Handle FULL_ACCESS permission for super admin
    if (rolePermissions.includes(PERMISSIONS.FULL_ACCESS)) {
      return true;
    }
    return rolePermissions.includes(permission);
  },

  /**
   * Get all permissions for a role
   */
  getRolePermissions: (role: UserRole): readonly string[] => {
    return ROLE_PERMISSIONS[role];
  },

  /**
   * Secure storage utilities
   * @deprecated With HTTP-only cookies, most storage operations are unnecessary.
   * Tokens are managed by the backend. Use Zustand stores for state management instead.
   */
  secureStorage: {
    /**
     * @deprecated Use Zustand stores for state management instead
     */
    setSensitive: (key: string, value: string): void => {
      getSessionStorage().setItem(key, value);
    },

    /**
     * @deprecated Use Zustand stores for state management instead
     */
    getSensitive: (key: string): string | null => {
      return getSessionStorage().getItem(key);
    },

    /**
     * @deprecated Use Zustand stores for state management instead
     */
    removeSensitive: (key: string): void => {
      getSessionStorage().removeItem(key);
    },

    /**
     * Store non-sensitive data in localStorage with validation
     */
    setNonSensitive: (key: string, value: string): void => {
      if (
        (AUTH_CONFIG.SECURE_STORAGE.FORBIDDEN_LOCALSTORAGE_KEYS as readonly string[]).includes(key)
      ) {
        log.warn(
          "AUTH",
          "[AUTH_CONFIG] Attempted to store forbidden key in localStorage. Use sessionStorage instead.",
          { key }
        );
        return;
      }
      getLocalStorage().setItem(key, value);
    },

    /**
     * Get non-sensitive data from localStorage
     */
    getNonSensitive: (key: string): string | null => {
      return getLocalStorage().getItem(key);
    },

    /**
     * Remove non-sensitive data from localStorage
     */
    removeNonSensitive: (key: string): void => {
      getLocalStorage().removeItem(key);
    },

    /**
     * Clear all auth-related storage
     * Note: This does NOT clear HTTP-only cookies - use authApi.logout() for that
     */
    clearAll: (): void => {
      const session = getSessionStorage();
      const local = getLocalStorage();
      Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach((key) => {
        session.removeItem(key);
      });
      Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach((key) => {
        if (!AUTH_CONFIG.SECURE_STORAGE.FORBIDDEN_LOCALSTORAGE_KEYS.includes(key)) {
          local.removeItem(key);
        }
      });
      AUTH_CONFIG.SECURE_STORAGE.FORBIDDEN_LOCALSTORAGE_KEYS.forEach((key) => {
        local.removeItem(key);
      });
    },
  },
} as const;
