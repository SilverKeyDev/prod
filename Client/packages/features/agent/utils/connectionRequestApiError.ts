import { resolveUserFacingMessage } from "packages/utils/core/errorHandling";

/**
 * User-facing message from a failed connection-request API call (4xx/5xx JSON body or Error).
 */
export function connectionRequestApiErrorMessage(
  error: unknown,
  fallback = "Failed to send connection request"
): string {
  return resolveUserFacingMessage(error, { fallbackMessage: fallback });
}
