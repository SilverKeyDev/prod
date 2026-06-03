/**
 * Single entry point for user-visible error text.
 * Never surface raw API error codes when a safe alternative exists.
 */

import { AuthenticationError, HttpError } from "packages/services/http/client/errors";

import {
  type ApiErrorShape,
  looksLikeMachineErrorCode,
  resolveFromApiShape,
  resolveGenericApiErrorFallback,
} from "./apiErrorShape";
import { ERROR_CATALOG, lookupErrorCatalogEntry } from "./errorCatalog";
import { normalizeError } from "./normalize";
import { getUserFriendlyMessage } from "./userMessages";

export type { ApiErrorShape } from "./apiErrorShape";
export { looksLikeMachineErrorCode } from "./apiErrorShape";

export type ResolveUserFacingMessageOptions = {
  /** Fallback when nothing else resolves (e.g. "Failed to save checklist"). */
  fallbackMessage?: string;
  /** i18n lookup from LocalizationContext (e.g. `t`). */
  translate?: (key: string) => string;
};

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveFromCatalog(code: string, translate?: (key: string) => string): string | undefined {
  const entry = lookupErrorCatalogEntry(code);
  if (!entry) return undefined;
  if (translate) {
    const translated = translate(entry.i18nKey);
    if (translated && translated !== entry.i18nKey) return translated;
  }
  return entry.fallbackEn;
}

function resolveFromHttpError(
  error: HttpError,
  options?: ResolveUserFacingMessageOptions
): string | undefined {
  if (error.parsedBody && typeof error.parsedBody === "object") {
    const fromBody = resolveFromApiShape(error.parsedBody as ApiErrorShape, options);
    if (fromBody) return fromBody;
  }

  const errMessage = readTrimmedString(error.message);
  if (errMessage && !errMessage.startsWith("HTTP ") && !looksLikeMachineErrorCode(errMessage)) {
    return errMessage;
  }

  return undefined;
}

function resolveFromAuthenticationError(
  error: AuthenticationError,
  options?: ResolveUserFacingMessageOptions
): string | undefined {
  const fromCatalog = resolveFromCatalog(error.errorCode, options?.translate);
  if (fromCatalog) return fromCatalog;

  const msg = readTrimmedString(error.message);
  if (msg) {
    const afterDash = msg.includes(" - ") ? msg.split(" - ").slice(1).join(" - ").trim() : msg;
    if (afterDash && !looksLikeMachineErrorCode(afterDash)) return afterDash;
  }

  return undefined;
}

/**
 * Converts API errors, HttpError, AppError, or unknown throws into user-safe text.
 */
export function resolveUserFacingMessage(
  error: unknown,
  options?: ResolveUserFacingMessageOptions
): string {
  if (error && typeof error === "object" && "success" in error) {
    const fromApi = resolveFromApiShape(error as ApiErrorShape, options);
    if (fromApi) return fromApi;
    if ((error as ApiErrorShape).success === false) {
      return options?.fallbackMessage ?? resolveGenericApiErrorFallback(options?.translate);
    }
  }

  if (error instanceof HttpError) {
    const fromHttp = resolveFromHttpError(error, options);
    if (fromHttp) return fromHttp;
  }

  if (error instanceof AuthenticationError) {
    const fromAuth = resolveFromAuthenticationError(error, options);
    if (fromAuth) return fromAuth;
  }

  if (error instanceof Error) {
    const msg = readTrimmedString(error.message);
    if (msg && !msg.startsWith("HTTP ") && !looksLikeMachineErrorCode(msg)) {
      return msg;
    }
  }

  if (typeof error === "string" && error.trim()) {
    const trimmed = error.trim();
    if (!looksLikeMachineErrorCode(trimmed)) return trimmed;
    const fromCatalog = resolveFromCatalog(trimmed, options?.translate);
    if (fromCatalog) return fromCatalog;
  }

  try {
    const normalized = normalizeError(error);
    const friendly = getUserFriendlyMessage(normalized);
    if (friendly) return friendly;
  } catch {
    // fall through to generic
  }

  return options?.fallbackMessage ?? resolveGenericApiErrorFallback(options?.translate);
}

/** Resolves message from a `{ success, error, message? }` API result. */
export function resolveApiResultErrorMessage(
  response: ApiErrorShape,
  fallbackMessage: string,
  options?: Omit<ResolveUserFacingMessageOptions, "fallbackMessage">
): string {
  return resolveUserFacingMessage(response, {
    ...options,
    fallbackMessage,
  });
}

/** Exported for tests — ensure catalog stays non-empty. */
export const errorCatalogSize = Object.keys(ERROR_CATALOG).length;
