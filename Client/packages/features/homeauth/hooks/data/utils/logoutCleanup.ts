/**
 * Session storage keys cleared on logout (non-sensitive flags only).
 * Production tokens are in HTTP-only cookies; dev account sessions add a tab-scoped bearer token.
 */
export const SESSION_KEYS_TO_CLEAR = [
  "dev_session_access_token",
  "signupEmail",
  "signupPassword",
  "auth_last_verify_at",
  "auth_ready_dispatched",
  "reports_fetch_logged",
  "reports_loaded_logged",
  "saved_homes_fetch_logged",
  "saved_homes_loaded_logged",
  "auth_restored_logged",
  "user_restored_logged",
] as const;

/** Get optional session storage via global object (RN-safe: no direct sessionStorage reference). */
export function getOptionalSessionStorageForLogout(): Storage | undefined {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : null;
    return g ? (g as unknown as Record<string, Storage | undefined>)["sessionStorage"] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Removes session storage items used for auth/session flags.
 * Call during logout after clearing auth state.
 * Web-only when sessionStorage is available; no-op in RN.
 */
export function clearSessionStorageForLogout(): void {
  const storage = getOptionalSessionStorageForLogout();
  if (!storage) return;
  for (const key of SESSION_KEYS_TO_CLEAR) {
    storage.removeItem(key);
  }
}
