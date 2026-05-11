/**
 * Shared guards for config/http API wrappers used by React Query data routes.
 */

export type ApiResultBase = {
  success: boolean;
  error?: string | null;
};

function resolveApiErrorMessage(response: ApiResultBase, fallbackMessage: string): string {
  if (typeof response.error === "string" && response.error.length > 0) {
    return response.error;
  }
  return fallbackMessage;
}

/**
 * Throws if `response.success` is false. Use before reading success-only fields.
 */
export function throwUnlessApiSuccess(response: ApiResultBase, fallbackMessage: string): void {
  if (!response.success) {
    throw new Error(resolveApiErrorMessage(response, fallbackMessage));
  }
}

/**
 * Throws unless the response succeeded and `data` is non-nullish. Returns `data`.
 */
export function requireApiSuccessData<T>(
  response: ApiResultBase & { data?: T | null },
  fallbackMessage: string
): T {
  if (!response.success || response.data == null) {
    throw new Error(resolveApiErrorMessage(response, fallbackMessage));
  }
  return response.data;
}
