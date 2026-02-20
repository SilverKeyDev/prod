/**
 * Google Calendar API types
 * GoogleEvent lives in schemas/calendar to avoid config → utils cycles.
 */

export type { GoogleEvent } from "packages/schemas/calendar/googleEvent";

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleEventListResponse {
  kind: string;
  etag: string;
  summary: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleEvent[];
}

export interface GoogleEventCreateResponse extends GoogleEvent {
  kind: string;
  etag: string;
  htmlLink: string;
  created: string;
  updated: string;
  creator: {
    email: string;
    displayName?: string;
  };
  organizer: {
    email: string;
    displayName?: string;
  };
  sequence: number;
  iCalUID: string;
  status: string;
}

export interface GoogleCalendarApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GoogleCalendarPermission {
  granted: boolean;
  description: string;
  scope: string;
}

export interface GoogleCalendarPermissionsResponse {
  permissions: Record<string, GoogleCalendarPermission>;
  scopes: string;
  last_updated?: string;
}
