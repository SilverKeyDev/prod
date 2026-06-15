import { dateNow } from "packages/utils/core/date";

import { isArray, isError, isErrorLike, isNumber, isObject, isString } from "./typeGuardsBase";

/**
 * Extended type guards: DOM, utility, complex, union, validation, error handling.
 * Base guards (basic, error, date, function, API) live in typeGuardsBase.ts.
 */

// ============================================================================
// DOM TYPE GUARDS
// ============================================================================

export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function isEvent(value: unknown): value is Event {
  return value instanceof Event;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

export function isNonEmptyArray<T = unknown>(value: unknown): value is T[] {
  return isArray<T>(value) && value.length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// COMPLEX TYPE GUARDS
// ============================================================================

export function hasProperty<K extends string>(
  value: unknown,
  property: K
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

export function hasAllProperties<K extends string>(
  value: unknown,
  properties: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) return false;
  return properties.every((prop) => prop in value);
}

export function matchesShape<T>(
  value: unknown,
  shape: Record<string, (val: unknown) => boolean>
): value is T {
  if (!isObject(value)) return false;
  return Object.entries(shape).every(([key, validator]) => {
    return validator(value[key]);
  });
}

// ============================================================================
// UNION TYPE GUARDS
// ============================================================================

export function isOneOf<T extends string | number | boolean>(
  value: unknown,
  options: readonly T[]
): value is T {
  return options.includes(value as T);
}

export function isStringOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return isString(value) && options.includes(value as T);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function createCombinedGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return guards.every((guard) => guard(value));
  };
}

export function createUnionGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return guards.some((guard) => guard(value));
  };
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function extractErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (isErrorLike(error)) return error.message;
  if (isString(error)) return error;
  if (isObject(error) && "message" in error && isString(error.message)) {
    return error.message;
  }
  return "An unknown error occurred";
}

export function extractErrorDetails(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
  code?: string | number;
} {
  const details: ReturnType<typeof extractErrorDetails> = {
    message: extractErrorMessage(error),
  };
  if (isError(error)) {
    details.name = error.name;
    details.stack = error.stack;
    if ("code" in error) {
      details.code = (error as Error & { code?: string | number }).code;
    }
  }
  if (isErrorLike(error)) {
    details.name = error.name;
    details.stack = error.stack;
  }
  if (isObject(error)) {
    if ("name" in error && isString(error.name)) details.name = error.name;
    if ("code" in error && (isString(error.code) || isNumber(error.code))) {
      details.code = error.code;
    }
  }
  return details;
}

export function createSafeErrorHandler(error: unknown, context?: Record<string, unknown>) {
  const details = extractErrorDetails(error);
  return {
    ...details,
    context,
    timestamp: dateNow().toISOString(),
    id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  };
}

export function isDocumentData(value: unknown): value is Record<string, unknown> {
  return (
    isObject(value) &&
    (isString(value.id) || isNumber(value.id)) &&
    (isString(value.filename) || isNumber(value.filename)) &&
    (isString(value.file_path) || isNumber(value.file_path))
  );
}
