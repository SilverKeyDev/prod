/**
 * API `{ success, error, message? }` message resolution — shared by normalize and resolveUserFacingMessage.
 */

import {
  GENERIC_ERROR_FALLBACK_EN,
  GENERIC_ERROR_I18N_KEY,
  lookupErrorCatalogEntry,
} from "./errorCatalog";
import { extractFirstValidationMessage } from "./extractValidationDetail";

const MACHINE_CODE_RE = /^[A-Z0-9_]+$/;
const SNAKE_CASE_CODE_RE = /^[a-z][a-z0-9_]*$/;

export type ApiErrorShape = {
  success?: boolean;
  error?: string | null;
  message?: string | null;
  field_errors?: Record<string, string | string[]> | null;
  validation_errors?: Record<string, unknown> | string[] | null;
};

export type ResolveApiErrorShapeOptions = {
  translate?: (key: string) => string;
};

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** True when the string looks like a machine error code, not human prose. */
export function looksLikeMachineErrorCode(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(" ")) return false;
  return MACHINE_CODE_RE.test(trimmed) || SNAKE_CASE_CODE_RE.test(trimmed);
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

export function resolveGenericApiErrorFallback(translate?: (key: string) => string): string {
  if (translate) {
    const translated = translate(GENERIC_ERROR_I18N_KEY);
    if (translated && translated !== GENERIC_ERROR_I18N_KEY) return translated;
  }
  return GENERIC_ERROR_FALLBACK_EN;
}

/** Resolves user-visible text from an API error shape when possible. */
export function resolveFromApiShape(
  shape: ApiErrorShape,
  options?: ResolveApiErrorShapeOptions
): string | undefined {
  const message = readTrimmedString(shape.message);
  if (message) return message;

  const fromValidation = extractFirstValidationMessage(shape as Record<string, unknown>);
  if (fromValidation) return fromValidation;

  const code = readTrimmedString(shape.error);
  if (code) {
    const fromCatalog = resolveFromCatalog(code, options?.translate);
    if (fromCatalog) return fromCatalog;
    if (!looksLikeMachineErrorCode(code)) return code;
  }

  return undefined;
}
