import { dateParseISO } from "packages/utils/core/date";

/**
 * Base type guards: basic types, error, date, function, API response.
 * Extended guards (utility, complex, union, error handling) live in typeGuardsExtended.ts.
 */

// ============================================================================
// BASIC TYPE GUARDS
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isErrorLike(
  value: unknown
): value is { message: string; name?: string; stack?: string } {
  return isObject(value) && "message" in value && isString(value.message);
}

export function isPromiseRejection(value: unknown): value is PromiseRejectedResult {
  return isObject(value) && "status" in value && value.status === "rejected" && "reason" in value;
}

// ============================================================================
// DATE TYPE GUARDS
// ============================================================================

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    const d = dateParseISO(value);
    return d.toISOString() === value;
  } catch {
    return false;
  }
}

export function isTimestamp(value: unknown): value is number {
  if (!isNumber(value)) return false;
  const minTimestamp = 0;
  const maxTimestamp = 4102444800000;
  return value >= minTimestamp && value <= maxTimestamp;
}

// ============================================================================
// FUNCTION TYPE GUARDS
// ============================================================================

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

export function isAsyncFunction(value: unknown): value is (...args: unknown[]) => Promise<unknown> {
  return isFunction(value) && value.constructor.name === "AsyncFunction";
}

// ============================================================================
// API RESPONSE TYPE GUARDS
// ============================================================================

export function isApiSuccess<T = unknown>(value: unknown): value is { success: true; data: T } {
  return isObject(value) && "success" in value && value.success === true && "data" in value;
}

export function isApiError(
  value: unknown
): value is { success: false; error: string; message?: string } {
  return (
    isObject(value) &&
    "success" in value &&
    value.success === false &&
    "error" in value &&
    isString(value.error)
  );
}

export function isApiResponse<T = unknown>(
  value: unknown
): value is { success: true; data: T } | { success: false; error: string; message?: string } {
  return isApiSuccess<T>(value) || isApiError(value);
}
