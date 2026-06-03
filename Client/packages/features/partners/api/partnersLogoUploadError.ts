import { HttpError } from "packages/services/http/client";

type UploadErrorBody = {
  message?: string;
  validation_errors?: string[];
  additional_info?: {
    message?: string;
    allowed_types?: string[];
  };
};

/** Surface server validation messages from partner logo upload failures. */
export function getPartnerLogoUploadErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
    const body = err.parsedBody as UploadErrorBody;
    const detail =
      body.message ??
      body.additional_info?.message ??
      (Array.isArray(body.validation_errors) ? body.validation_errors[0] : undefined);
    if (detail && typeof detail === "string") {
      return detail;
    }
  }
  if (err instanceof Error && err.message && !err.message.startsWith("HTTP ")) {
    return err.message;
  }
  return fallback;
}
