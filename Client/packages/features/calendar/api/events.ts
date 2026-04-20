/**
 * Google Calendar events CRUD.
 */

import { apiDelete, apiGet, apiPatch, apiPost } from "packages/services/http/compatibility";

import { wrapGoogleCalendarError } from "./errors";
import type {
  DeleteEventResponse,
  GoogleCalendarApiResponse,
  GoogleCalendarEventCreateBody,
  GoogleEvent,
  GoogleEventCreateResponse,
  GoogleEventListResponse,
} from "./types";

export async function listEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
}): Promise<GoogleCalendarApiResponse<GoogleEventListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.calendarId) queryParams.append("calendarId", params.calendarId);
  if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
  if (params?.timeMax) queryParams.append("timeMax", params.timeMax);
  const url = `/api/v1/google/me/events${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  return wrapGoogleCalendarError(
    () => apiGet<GoogleCalendarApiResponse<GoogleEventListResponse>>(url),
    "Failed to list events"
  );
}

export async function createEvent(
  event: GoogleCalendarEventCreateBody
): Promise<GoogleCalendarApiResponse<GoogleEventCreateResponse>> {
  return wrapGoogleCalendarError(
    () =>
      apiPost<GoogleCalendarApiResponse<GoogleEventCreateResponse>>(
        "/api/v1/google/me/events",
        event
      ),
    "Failed to create event"
  );
}

export async function updateEvent(
  eventId: string,
  event: GoogleEvent
): Promise<GoogleCalendarApiResponse<GoogleEventCreateResponse>> {
  return wrapGoogleCalendarError(
    () =>
      apiPatch<GoogleCalendarApiResponse<GoogleEventCreateResponse>>(
        `/api/v1/google/me/events/${eventId}`,
        event
      ),
    "Failed to update event"
  );
}

export async function deleteEvent(
  eventId: string,
  calendarId?: string
): Promise<DeleteEventResponse> {
  const queryParams = calendarId ? `?calendarId=${calendarId}` : "";
  return wrapGoogleCalendarError(
    () => apiDelete<DeleteEventResponse>(`/api/v1/google/me/events/${eventId}${queryParams}`),
    "Failed to delete event"
  );
}
