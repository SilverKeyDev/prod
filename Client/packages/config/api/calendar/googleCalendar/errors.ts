/**
 * Shared error handling for Google Calendar API responses.
 */

import { HttpError } from "packages/services/http/compatibility";

import type { GoogleCalendarApiResponse } from "./types";

/**
 * Wraps an API call and returns a GoogleCalendarApiResponse, catching HttpError
 * and extracting error message from parsedBody when available.
 */
export async function wrapGoogleCalendarError<T>(
  fn: () => Promise<GoogleCalendarApiResponse<T>>,
  fallbackMessage: string,
): Promise<GoogleCalendarApiResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError && error.parsedBody) {
      const parsedBody = error.parsedBody as {
        error?: string;
        message?: string;
      };
      return {
        success: false,
        error: parsedBody.error || parsedBody.message || fallbackMessage,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    };
  }
}
