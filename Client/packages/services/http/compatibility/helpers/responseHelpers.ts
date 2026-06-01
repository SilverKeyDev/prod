/**
 * Response type helpers
 */

import type { ApiResponse } from "packages/types/domain/api";

export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    typeof (response as unknown as { success: boolean }).success === "boolean"
  );
}

export function extractApiData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    let message: string | undefined;
    if ("error" in response && typeof response.error === "string") {
      message = response.error;
    } else if ("message" in (response as unknown as Record<string, unknown>)) {
      const maybeMessage = (response as unknown as Record<string, unknown>).message;
      if (typeof maybeMessage === "string") message = maybeMessage;
    }
    const errorMessage = message ?? "API request failed";
    throw new Error(errorMessage);
  }
  return response.data as T;
}
