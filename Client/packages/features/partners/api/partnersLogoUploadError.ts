import { HttpError } from "packages/services/http/client";
import { extractFirstValidationMessage } from "packages/utils/core/errorHandling/extractValidationDetail";

/** Surface server validation messages from partner logo upload failures. */
export function getPartnerLogoUploadErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
    const detail = extractFirstValidationMessage(err.parsedBody as Record<string, unknown>);
    if (detail) return detail;
  }
  if (err instanceof Error && err.message && !err.message.startsWith("HTTP ")) {
    return err.message;
  }
  return fallback;
}
