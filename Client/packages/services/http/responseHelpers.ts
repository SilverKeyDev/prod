import type { ApiResponse } from "packages/types/domain/api";
import { resolveUserFacingMessage } from "packages/utils/core/errorHandling";

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
    const errorMessage = resolveUserFacingMessage(response, {
      fallbackMessage: "API request failed",
    });
    throw new Error(errorMessage);
  }
  return response.data as T;
}
