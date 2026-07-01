/**
 * 401 error codes that indicate a third-party integration auth problem,
 * not a dead SilverKey session. These must not trigger global logout/refresh.
 */
export const NON_SESSION_401_ERROR_CODES = [
  "GOOGLE_RECONNECT_REQUIRED",
  "client_permission_required",
] as const;

export type NonSession401ErrorCode = (typeof NON_SESSION_401_ERROR_CODES)[number];

export function isNonSession401Error(errorCode: string | undefined): boolean {
  if (!errorCode) {
    return false;
  }
  return (NON_SESSION_401_ERROR_CODES as readonly string[]).includes(errorCode);
}

export function parse401ErrorCode(responseText: string, contentType: string): string | undefined {
  if (!contentType.includes("application/json") || !responseText.trim()) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(responseText) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}
