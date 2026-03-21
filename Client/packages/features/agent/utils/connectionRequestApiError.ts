import { HttpError } from "packages/services/http/client/errors";

function readStringField(body: Record<string, unknown>, key: string): string | undefined {
  const v = body[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

/**
 * User-facing message from a failed connection-request API call (4xx/5xx JSON body or Error).
 */
export function connectionRequestApiErrorMessage(
  error: unknown,
  fallback = "Failed to send connection request"
): string {
  if (error instanceof HttpError && error.parsedBody && typeof error.parsedBody === "object") {
    const body = error.parsedBody as Record<string, unknown>;
    const fromError = readStringField(body, "error");
    if (fromError) return fromError;
    const fromMessage = readStringField(body, "message");
    if (fromMessage) return fromMessage;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
