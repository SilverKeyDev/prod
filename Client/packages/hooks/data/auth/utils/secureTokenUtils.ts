/**
 * Secure token utilities for auth.
 * With HTTP-only cookies, these only log metadata; tokens are not stored client-side.
 */

import { log, LOG_CATEGORIES } from "logger";

import { asError, getWindow } from "packages/utils";

/** Web-only: hook for secure access token (e.g. from HTTP-only cookie bridge). */
type WindowWithToken = Window & { getSecureAccessToken?: () => string | null };

/**
 * Get access token from platform window hook if available (secure path only).
 * Uses platform adapter so shared package stays RN-safe.
 */
export function getSecureAccessToken(): string | null {
  const win = getWindow() as WindowWithToken | null;
  if (win && typeof win.getSecureAccessToken === "function") {
    return win.getSecureAccessToken() ?? null;
  }
  return null;
}

/**
 * Check if a JWT is expired or expires within the given buffer (minutes).
 */
export function isTokenExpiringSoon(
  token: string | null,
  bufferMinutes: number = 5,
): boolean {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const decoded = JSON.parse(jsonPayload) as { exp: number };
    const expiresAt = decoded.exp * 1000;
    const expiresIn = expiresAt - Date.now();
    const bufferMs = bufferMinutes * 60 * 1000;
    return expiresIn < bufferMs;
  } catch (error) {
    log.warn(LOG_CATEGORIES.AUTH, "Failed to decode token for expiry check", {
      error: asError(error).message,
    });
    return true;
  }
}

/**
 * Token utilities with security-aware logging.
 * NOTE: With HTTP-only cookies, tokens are not stored or read by JS.
 */
export const secureTokenUtils = {
  storeTokens: (tokens: {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  }) => {
    const accessTokenSize = tokens.access_token?.length ?? 0;
    const refreshTokenSize = tokens.refresh_token?.length ?? 0;
    const idTokenSize = tokens.id_token?.length ?? 0;
    const totalSize = accessTokenSize + refreshTokenSize + idTokenSize;
    log.security(
      LOG_CATEGORIES.AUTH,
      "Token metadata logged (tokens NOT stored - using HTTP-only cookies)",
      {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        accessTokenSize,
        refreshTokenSize,
        idTokenSize,
        totalSize,
        storageMethod: "http_only_cookies",
        note: "Tokens are in HTTP-only cookies, not accessible to JS",
      },
    );
  },

  clearAllTokens: () => {
    log.security(LOG_CATEGORIES.AUTH, "Token clearing delegated to server", {
      note: "HTTP-only cookies can only be cleared by server",
    });
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload: unknown = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      if (payload && typeof payload === "object" && "exp" in payload) {
        return (payload as { exp: number }).exp < currentTime;
      }
      return true;
    } catch {
      return true;
    }
  },
};
