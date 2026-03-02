/**
 * Google Calendar free/busy and client availability/events.
 */

import { apiGet, apiPost } from "packages/services/http/compatibility";

import type { FreebusyRequest, FreebusyResponse } from "@/features/calendar/types/scheduling";

import { wrapGoogleCalendarError } from "./errors";
import type { GoogleCalendarApiResponse, GoogleEventListResponse } from "./types";

export async function queryFreebusy(
  request: FreebusyRequest
): Promise<GoogleCalendarApiResponse<FreebusyResponse>> {
  return apiPost<GoogleCalendarApiResponse<FreebusyResponse>>(
    "/api/v1/google/me/freebusy",
    request
  );
}

export async function getClientAvailability(
  clientId: string,
  timeMin: string,
  timeMax: string,
  calendarIds?: string[]
): Promise<GoogleCalendarApiResponse<FreebusyResponse>> {
  return wrapGoogleCalendarError(
    () =>
      apiPost<GoogleCalendarApiResponse<FreebusyResponse>>(
        `/api/v1/google/clients/${clientId}/availability`,
        {
          timeMin,
          timeMax,
          calendarIds: calendarIds || ["primary"],
        }
      ),
    "Failed to get client availability"
  );
}

export async function getClientEvents(
  clientId: string,
  params?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: string;
  }
): Promise<GoogleCalendarApiResponse<GoogleEventListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.calendarId) queryParams.append("calendarId", params.calendarId);
  if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
  if (params?.timeMax) queryParams.append("timeMax", params.timeMax);
  if (params?.maxResults) queryParams.append("maxResults", params.maxResults);
  const url = `/api/v1/google/clients/${clientId}/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  return wrapGoogleCalendarError(
    () => apiGet<GoogleCalendarApiResponse<GoogleEventListResponse>>(url),
    "Failed to get client events"
  );
}
