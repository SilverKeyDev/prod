import { getSessionStorage } from "packages/utils/storage/platformStorage";

/** SessionStorage key used for tab-scoped dev account sessions. */
export const DEV_SESSION_ACCESS_TOKEN_KEY = "dev_session_access_token";

export function getAuthToken(): string | null {
  try {
    return getSessionStorage().getItem(DEV_SESSION_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeDevSessionAccessToken(token: string): void {
  getSessionStorage().setItem(DEV_SESSION_ACCESS_TOKEN_KEY, token);
}

export function clearDevSessionAccessToken(): void {
  try {
    getSessionStorage().removeItem(DEV_SESSION_ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
