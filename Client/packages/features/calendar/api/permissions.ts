/**
 * Google Calendar permissions.
 */

import { apiGet } from "packages/services/http";

import { wrapGoogleCalendarError } from "./errors";
import type { GoogleCalendarApiResponse, GoogleCalendarPermissionsResponse } from "./types";

export async function getPermissions(): Promise<
  GoogleCalendarApiResponse<GoogleCalendarPermissionsResponse>
> {
  return wrapGoogleCalendarError(
    () =>
      apiGet<GoogleCalendarApiResponse<GoogleCalendarPermissionsResponse>>(
        "/api/v1/google/me/permissions"
      ),
    "Failed to get permissions"
  );
}
