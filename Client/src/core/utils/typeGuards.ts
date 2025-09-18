/**
 * Comprehensive Type Guards Utility
 * Centralized type checking and validation functions
 */

// ============================================================================
// BASIC TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a string
 * @param value - The value to check
 * @returns true if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 * @param value - The value to check
 * @returns true if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 * @param value - The value to check
 * @returns true if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is an object (but not null or array)
 * @param value - The value to check
 * @returns true if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 * @param value - The value to check
 * @returns true if value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is null or undefined
 * @param value - The value to check
 * @returns true if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if a value is not null or undefined
 * @param value - The value to check
 * @returns true if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is an Error instance
 * @param value - The value to check
 * @returns true if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value is an error-like object
 * @param value - The value to check
 * @returns true if value has error-like properties
 */
export function isErrorLike(
  value: unknown
): value is { message: string; name?: string; stack?: string } {
  return isObject(value) && 'message' in value && isString(value.message);
}

/**
 * Type guard to check if a value is a promise rejection
 * @param value - The value to check
 * @returns true if value is a promise rejection
 */
export function isPromiseRejection(value: unknown): value is PromiseRejectedResult {
  return isObject(value) && 'status' in value && value.status === 'rejected' && 'reason' in value;
}

// ============================================================================
// DATE TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid Date
 * @param value - The value to check
 * @returns true if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if a value is a date string (ISO format)
 * @param value - The value to check
 * @returns true if value is a valid date string
 */
export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;

  const date = new Date(value);
  return isValidDate(date) && date.toISOString() === value;
}

/**
 * Type guard to check if a value is a timestamp (number)
 * @param value - The value to check
 * @returns true if value is a valid timestamp
 */
export function isTimestamp(value: unknown): value is number {
  if (!isNumber(value)) return false;

  // Check if it's a reasonable timestamp (between 1970 and 2100)
  const minTimestamp = 0;
  const maxTimestamp = 4102444800000; // 2100-01-01
  return value >= minTimestamp && value <= maxTimestamp;
}

// ============================================================================
// FUNCTION TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a function
 * @param value - The value to check
 * @returns true if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard to check if a value is an async function
 * @param value - The value to check
 * @returns true if value is an async function
 */
export function isAsyncFunction(value: unknown): value is (...args: unknown[]) => Promise<unknown> {
  return isFunction(value) && value.constructor.name === 'AsyncFunction';
}

// ============================================================================
// API RESPONSE TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a successful API response
 * @param value - The value to check
 * @returns true if value is a successful API response
 */
export function isApiSuccess<T = unknown>(value: unknown): value is { success: true; data: T } {
  return isObject(value) && 'success' in value && value.success === true && 'data' in value;
}

/**
 * Type guard to check if a value is an API error response
 * @param value - The value to check
 * @returns true if value is an API error response
 */
export function isApiError(
  value: unknown
): value is { success: false; error: string; message?: string } {
  return (
    isObject(value) &&
    'success' in value &&
    value.success === false &&
    'error' in value &&
    isString(value.error)
  );
}

/**
 * Type guard to check if a value is an API response (success or error)
 * @param value - The value to check
 * @returns true if value is an API response
 */
export function isApiResponse<T = unknown>(
  value: unknown
): value is { success: true; data: T } | { success: false; error: string; message?: string } {
  return isApiSuccess<T>(value) || isApiError(value);
}

// ============================================================================
// DOM TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is an HTMLElement
 * @param value - The value to check
 * @returns true if value is an HTMLElement
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Type guard to check if a value is a DOM Event
 * @param value - The value to check
 * @returns true if value is a DOM Event
 */
export function isEvent(value: unknown): value is Event {
  return value instanceof Event;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a non-empty string
 * @param value - The value to check
 * @returns true if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Type guard to check if a value is a non-empty array
 * @param value - The value to check
 * @returns true if value is a non-empty array
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is T[] {
  return isArray<T>(value) && value.length > 0;
}

/**
 * Type guard to check if a value is a positive number
 * @param value - The value to check
 * @returns true if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Type guard to check if a value is a non-negative number
 * @param value - The value to check
 * @returns true if value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Type guard to check if a value is an integer
 * @param value - The value to check
 * @returns true if value is an integer
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Type guard to check if a value is a valid email string
 * @param value - The value to check
 * @returns true if value is a valid email string
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard to check if a value is a valid URL string
 * @param value - The value to check
 * @returns true if value is a valid URL string
 */
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

/**
 * Type guard to check if a value has a specific property
 * @param value - The value to check
 * @param property - The property name to check for
 * @returns true if value has the specified property
 */
export function hasProperty<K extends string>(
  value: unknown,
  property: K
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

/**
 * Type guard to check if a value has all specified properties
 * @param value - The value to check
 * @param properties - Array of property names to check for
 * @returns true if value has all specified properties
 */
export function hasAllProperties<K extends string>(
  value: unknown,
  properties: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) return false;

  return properties.every((prop) => prop in value);
}

/**
 * Type guard to check if a value matches a specific shape
 * @param value - The value to check
 * @param shape - Object describing the expected shape
 * @returns true if value matches the shape
 */
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

/**
 * Type guard to check if a value is one of the provided values
 * @param value - The value to check
 * @param options - Array of possible values
 * @returns true if value is one of the options
 */
export function isOneOf<T extends string | number | boolean>(
  value: unknown,
  options: readonly T[]
): value is T {
  return options.includes(value as T);
}

/**
 * Type guard to check if a value is a string that matches one of the provided options
 * @param value - The value to check
 * @param options - Array of possible string values
 * @returns true if value is a string matching one of the options
 */
export function isStringOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return isString(value) && options.includes(value as T);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Creates a type guard that validates a value against multiple conditions
 * @param guards - Array of type guard functions
 * @returns A combined type guard function
 */
export function createCombinedGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return guards.every((guard) => guard(value));
  };
}

/**
 * Creates a type guard that validates a value against any of the provided conditions
 * @param guards - Array of type guard functions
 * @returns A union type guard function
 */
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

/**
 * Safely extracts an error message from any value
 * @param error - The error value
 * @returns A string error message
 */
export function extractErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }

  if (isErrorLike(error)) {
    return error.message;
  }

  if (isString(error)) {
    return error;
  }

  if (isObject(error) && 'message' in error && isString(error.message)) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Safely extracts error details from any value
 * @param error - The error value
 * @returns An object with error details
 */
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
    if ('code' in error) {
      details.code = (error as Error & { code?: string | number }).code;
    }
  }

  if (isErrorLike(error)) {
    details.name = error.name;
    details.stack = error.stack;
  }

  if (isObject(error)) {
    if ('name' in error && isString(error.name)) {
      details.name = error.name;
    }
    if ('code' in error && (isString(error.code) || isNumber(error.code))) {
      details.code = error.code;
    }
  }

  return details;
}

/**
 * Creates a safe error handler that normalizes any error into a consistent format
 * @param error - The error to handle
 * @param context - Additional context for the error
 * @returns A normalized error object
 */
export function createSafeErrorHandler(error: unknown, context?: Record<string, unknown>) {
  const details = extractErrorDetails(error);

  return {
    ...details,
    context,
    timestamp: new Date().toISOString(),
    id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  };
}

/**
 * Type guard to check if a value is Document data from server
 * @param value - The value to check
 * @returns true if value has Document-like structure
 */
export function isDocumentData(value: unknown): value is Record<string, unknown> {
  return (
    isObject(value) &&
    (isString(value.id) || isNumber(value.id)) &&
    (isString(value.filename) || isNumber(value.filename)) &&
    (isString(value.file_path) || isNumber(value.file_path))
  );
}
