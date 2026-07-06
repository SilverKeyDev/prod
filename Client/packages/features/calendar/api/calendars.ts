/**
 * Google Calendar list, create, and ACL operations.
 */

import { apiGet, apiPost } from "packages/services/http";

import { wrapGoogleCalendarError } from "./errors";
import type {
  GoogleCalendar,
  GoogleCalendarApiResponse,
  GoogleCalendarListResponse,
} from "./types";

export async function listCalendars(): Promise<
  GoogleCalendarApiResponse<GoogleCalendarListResponse>
> {
  return wrapGoogleCalendarError(
    () =>
      apiGet<GoogleCalendarApiResponse<GoogleCalendarListResponse>>("/api/v1/google/me/calendars"),
    "Failed to fetch calendars"
  );
}

export async function createCalendar(
  name: string
): Promise<GoogleCalendarApiResponse<GoogleCalendar>> {
  return wrapGoogleCalendarError(
    () => apiPost<GoogleCalendarApiResponse<GoogleCalendar>>("/api/v1/google/calendars", { name }),
    "Failed to create calendar"
  );
}

export async function addCalendarAcl(
  calendarId: string,
  agentEmail: string,
  role: string = "writer"
): Promise<GoogleCalendarApiResponse<unknown>> {
  return wrapGoogleCalendarError(
    () =>
      apiPost<GoogleCalendarApiResponse<unknown>>(`/api/v1/google/calendars/${calendarId}/acl`, {
        agent_email: agentEmail,
        role,
      }),
    "Failed to add calendar ACL"
  );
}

export async function getOrCreateSilverKeyCalendar(
  buyerName?: string
): Promise<GoogleCalendarApiResponse<GoogleCalendar>> {
  return wrapGoogleCalendarError(
    () =>
      apiPost<GoogleCalendarApiResponse<GoogleCalendar>>("/api/v1/google/me/silverkey-calendar", {
        buyerName,
      }),
    "Failed to load SilverKey calendar"
  );
}
