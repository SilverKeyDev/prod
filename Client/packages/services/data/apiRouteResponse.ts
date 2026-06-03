/**
 * Shared guards for config/http API wrappers used by React Query data routes.
 */

import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

export type ApiResultBase = {
  success: boolean;
  error?: string | null;
  message?: string | null;
};

function resolveApiErrorMessage(response: ApiResultBase, fallbackMessage: string): string {
  return resolveApiResultErrorMessage(response, fallbackMessage);
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
  if (!response.success) {
    throw new Error(resolveApiErrorMessage(response, fallbackMessage));
  }
  if (response.data == null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}
