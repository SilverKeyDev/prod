import { NavigateFunction } from 'react-router-dom';

/**
 * Checks if user has valid auth tokens and redirects to login if not
 * @param navigate - React Router navigate function
 * @returns true if tokens exist, false if redirected to login
 */
export const checkAuthAndRedirect = (navigate: NavigateFunction): boolean => {
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  const authToken = idToken || token;

  if (!authToken) {
    console.log("❌ No auth token found, redirecting to login");
    navigate("/login");
    return false;
  }

  return true;
};

/**
 * Gets auth token from localStorage
 * @returns auth token or null if not found
 */
export const getAuthToken = (): string | null => {
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  return idToken || token;
};

/**
 * Clears all auth tokens from localStorage
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem("id_token");
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
};
