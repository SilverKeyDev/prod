/**
 * Google Calendar API client
 * Handles Google Calendar OAuth and API operations
 */

import { apiGet, apiPost } from "packages/services/http/compatibility";
import { getDocument, getWindow } from "packages/utils/core/platform";

// Types
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  location?: string;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
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

// API Client
export const googleCalendarApi = {
  /**
   * Start Google OAuth flow
   */
  startOAuth: async (): Promise<void> => {
    const win = getWindow();
    if (win) win.location.href = "/api/v1/google/oauth/start";
  },

  /**
   * Revoke Google Calendar access
   */
  revokeAccess: async (): Promise<
    GoogleCalendarApiResponse<{ ok: boolean }>
  > => {
    try {
      const response = await apiPost<
        GoogleCalendarApiResponse<{ ok: boolean }>
      >("/api/v1/google/oauth/revoke", {});
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to revoke access",
      };
    }
  },

  /**
   * List user's Google calendars
   */
  listCalendars: async (): Promise<
    GoogleCalendarApiResponse<GoogleCalendarListResponse>
  > => {
    try {
      const response = await apiGet<
        GoogleCalendarApiResponse<GoogleCalendarListResponse>
      >("/api/v1/google/me/calendars");
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list calendars",
      };
    }
  },

  /**
   * List events from a calendar
   */
  listEvents: async (params?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<GoogleCalendarApiResponse<GoogleEventListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.calendarId)
        queryParams.append("calendarId", params.calendarId);
      if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
      if (params?.timeMax) queryParams.append("timeMax", params.timeMax);

      const url = `/api/v1/google/me/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response =
        await apiGet<GoogleCalendarApiResponse<GoogleEventListResponse>>(url);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list events",
      };
    }
  },

  /**
   * Create a new event
   */
  createEvent: async (
    event: GoogleEvent,
  ): Promise<GoogleCalendarApiResponse<GoogleEventCreateResponse>> => {
    try {
      const response = await apiPost<
        GoogleCalendarApiResponse<GoogleEventCreateResponse>
      >("/api/v1/google/me/events", event);
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create event",
      };
    }
  },

  /**
   * Update an existing event
   */
  updateEvent: async (
    eventId: string,
    event: GoogleEvent,
  ): Promise<GoogleCalendarApiResponse<GoogleEventCreateResponse>> => {
    try {
      const { apiPatch } = await import("../../services/http/compatibility");
      const response = await apiPatch<
        GoogleCalendarApiResponse<GoogleEventCreateResponse>
      >(`/api/v1/google/me/events/${eventId}`, event);
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update event",
      };
    }
  },

  /**
   * Delete an event
   */
  deleteEvent: async (
    eventId: string,
    calendarId?: string,
  ): Promise<GoogleCalendarApiResponse<{ ok: boolean }>> => {
    try {
      const { apiDelete } = await import("../../services/http/compatibility");
      const queryParams = calendarId ? `?calendarId=${calendarId}` : "";
      const response = await apiDelete<
        GoogleCalendarApiResponse<{ ok: boolean }>
      >(`/api/v1/google/me/events/${eventId}${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete event",
      };
    }
  },

  /**
   * Start Google OAuth flow with optional full scope (for agent sharing)
   */
  startOAuthWithFullScope: async (): Promise<void> => {
    const win = getWindow();
    if (win) win.location.href = "/api/v1/google/oauth/start?full_scope=true";
  },

  /**
   * Create a secondary calendar
   */
  createCalendar: async (
    name: string,
  ): Promise<GoogleCalendarApiResponse<GoogleCalendar>> => {
    try {
      const response = await apiPost<GoogleCalendarApiResponse<GoogleCalendar>>(
        "/api/v1/google/calendars",
        { name },
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create calendar",
      };
    }
  },

  /**
   * Add ACL rule to calendar (grant agent access)
   */
  addCalendarAcl: async (
    calendarId: string,
    agentEmail: string,
    role: string = "writer",
  ): Promise<GoogleCalendarApiResponse<unknown>> => {
    try {
      const response = await apiPost<GoogleCalendarApiResponse<unknown>>(
        `/api/v1/google/calendars/${calendarId}/acl`,
        { agent_email: agentEmail, role },
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to add calendar ACL",
      };
    }
  },

  /**
   * Check if Google Calendar is connected
   */
  isConnected: (): boolean => {
    const doc = getDocument();
    return doc?.cookie?.includes("google_calendar_connected=true") ?? false;
  },

  /**
   * Clear connection status
   */
  clearConnectionStatus: (): void => {
    const doc = getDocument();
    if (doc) {
      doc.cookie =
        "google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
  },
};
