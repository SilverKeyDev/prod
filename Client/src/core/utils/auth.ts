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
    const payload: unknown = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload && typeof payload === 'object' && 'exp' in payload) {
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
    return JSON.parse(atob(token.split('.')[1]));
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
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Gets token expiration time as Date object
 * @param token - JWT token string
 * @returns Date object of expiration or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
};

/**
 * Checks if token will expire within specified minutes
 * @param token - JWT token string
 * @param minutes - minutes to check ahead
 * @returns true if token expires within the specified time
 */
export const willTokenExpireSoon = (token: string, minutes: number = 5): boolean => {
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
 * Gets authentication token from secure storage
 * Priority: memory → sessionStorage → localStorage (fallback)
 * @returns auth token string or null
 */
export const getAuthToken = (): string | null => {
  try {
    // First try to get from secure hook if available
    if (typeof window !== 'undefined') {
      const windowWithSecureAuth = window as unknown as { 
        getSecureAccessToken?: () => string | null 
      };
      if (windowWithSecureAuth.getSecureAccessToken) {
        const token = windowWithSecureAuth.getSecureAccessToken();
        if (token) {
          return token;
        }
      }
    }

    // Fallback to sessionStorage (more secure than localStorage)
    const sessionToken = sessionStorage.getItem('access_token');
    if (sessionToken) {
      return sessionToken;
    }

    return null;
  } catch (error: unknown) {
    console.warn('Error getting auth token:', error);
    return null;
  }
};

/**
 * Checks if user has a valid authentication token
 * @returns true if valid token exists
 */
export const hasValidAuthToken = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  // For HttpOnly cookie authentication, we use a placeholder token
  // The actual authentication is handled by the server via cookies
  if (token === 'http-only-cookie-auth') {
    return true;
  }

  if (!isValidJWTFormat(token)) return false;

  return !isTokenExpired(token);
};

/**
 * Clears all authentication tokens and user data
 * Handles both secure storage and fallback storage
 */
export const clearAuthTokens = (): void => {
  try {
    // Clear from secure hook if available
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { clearSecureAuthTokens: unknown }).clearSecureAuthTokens
    ) {
      (window as unknown as { clearSecureAuthTokens: unknown }).clearSecureAuthTokens();
    }

    // Clear from all storage locations
    const tokenKeys = ['access_token', 'refresh_token', 'id_token'];
    const userKeys = ['user', 'userProfile'];

    tokenKeys.forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });

    userKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log('🧹 All auth tokens cleared');
  } catch (error: unknown) {
    console.error('Error clearing auth tokens:', error);
  }
};

/**
 * Checks authentication and redirects if needed
 * @param navigate - Navigation function (optional)
 */
export const checkAuthAndRedirect = (navigate?: (path: string) => void): boolean => {
  const isValid = hasValidAuthToken();

  if (!isValid) {
    console.warn('🔒 Authentication required - redirecting to login');

    if (navigate) {
      navigate('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return false;
  }

  return true;
};
