import { logError } from "packages/utils/errorHandling/logging";
import { normalizeError } from "packages/utils/errorHandling/normalize";
import type { AppError } from "packages/utils/errorHandling/types";

import { errorReporter } from "./instance";

/**
 * Logs an error locally and sends it to the backend (ErrorReporter).
 * Use this when you want both logging and reporting; use reportError from
 * packages/utils/errorHandling for log-only.
 */
export function reportErrorWithCapture(
  error: AppError | unknown,
  context?: Record<string, unknown>
): void {
  const normalized =
    typeof error === "object" && error !== null && "id" in error && "timestamp" in error
      ? (error as AppError)
      : normalizeError(error, context);
  logError(normalized, context);
  const errForCapture = error instanceof Error ? error : new Error(normalized.message);
  errorReporter.captureError(errForCapture, context);
}

// React Error Boundary helper
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string
  ) {
    super(message);
    this.name = "ErrorBoundary";
  }
}
