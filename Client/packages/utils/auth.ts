/* =========================
   Pure Auth Validation Functions
   ========================= */

/**
 * Validates if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired, false if valid
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload: unknown = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload && typeof payload === "object" && "exp" in payload) {
      const typedPayload = payload as { exp: number };
      return typedPayload.exp < currentTime;
    }
    return true;
  } catch {
    // Invalid token format
    return true;
  }
};

/**
 * Extracts payload from JWT token without validation
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export const decodeTokenPayload = (token: string): unknown => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

/**
 * Validates JWT token format (basic structure check)
 * @param token - JWT token string
 * @returns true if token has valid JWT format
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3;
};

/**
 * Gets token expiration time as Date object
 * @param token - JWT token string
 * @returns Date object of expiration or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeTokenPayload(token);
  if (
    !payload ||
    typeof payload !== "object" ||
    !("exp" in payload) ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return new Date((payload as { exp: number }).exp * 1000);
};

/**
 * Checks if token will expire within specified minutes
 * @param token - JWT token string
 * @param minutes - minutes to check ahead
 * @returns true if token expires within the specified time
 */
export const willTokenExpireSoon = (
  token: string,
  minutes: number = 5,
): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }

  const futureTime = new Date(Date.now() + minutes * 60 * 1000);
  return expiration <= futureTime;
};

/* =========================
   Token Management Functions
   ========================= */

/**
 * Gets authentication token - always returns null for HTTP-only cookie auth
 * The browser automatically sends the session cookie with requests
 * @returns null (tokens are in HTTP-only cookies, not accessible to JS)
 */
export const getAuthToken = (): string | null => {
  // With HTTP-only cookies, we never have direct access to tokens
  // The browser automatically includes the session cookie in requests
  // Return null so Authorization header is not set
  return null;
};

/**
 * Checks if user has a valid authentication token
 * With HTTP-only cookies, auth state must be verified by calling the server
 * This function is deprecated - use server-side session verification instead
 * @deprecated Use authApi.verifySession() to check auth state
 * @returns false (client cannot verify HTTP-only cookies)
 */
export const hasValidAuthToken = (): boolean => {
  // Cannot verify HTTP-only cookies from client-side
  // Auth state must be checked via server API call
  return false;
};

/**
 * Clears all authentication tokens and user data
 * HTTP-only cookies can only be cleared by the server
 * @deprecated Use authApi.logout() to clear HTTP-only cookies
 */
export const clearAuthTokens = (): void => {
  // HTTP-only cookies can only be cleared by calling the server logout endpoint
  // No client-side token storage to clear
  console.log("🧹 Auth tokens are in HTTP-only cookies - use authApi.logout() to clear");
};

/**
 * Checks authentication and redirects if needed
 * @param navigate - Navigation function (optional)
 */
export const checkAuthAndRedirect = (
  navigate?: (path: string) => void,
): boolean => {
  const isValid = hasValidAuthToken();

  if (!isValid) {
    console.warn("🔒 Authentication required - redirecting to login");

    if (navigate) {
      navigate("/login");
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return false;
  }

  return true;
};
