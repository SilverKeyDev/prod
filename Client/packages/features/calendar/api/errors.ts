/**
 * Shared error handling for Google Calendar API responses.
 */

import { HttpError } from "packages/services/http";

/**
 * Wraps a calendar API call, catching HttpError and mapping to a failure payload.
 */
export async function wrapGoogleCalendarError<
  T extends {
    success?: boolean;
    error?: string;
    message?: string;
    client_has_connection?: boolean;
  },
>(fn: () => Promise<T>, fallbackMessage: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError && error.parsedBody) {
      const parsedBody = error.parsedBody as {
        error?: string;
        message?: string;
        client_has_connection?: boolean;
      };
      return {
        success: false,
        error: parsedBody.error || parsedBody.message || fallbackMessage,
        message: parsedBody.message,
        client_has_connection: parsedBody.client_has_connection,
      } as T;
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    } as T;
  }
}
