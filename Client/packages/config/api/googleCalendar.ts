/**
 * Google Calendar API client
 * Handles Google Calendar OAuth and API operations
 */

import { apiGet, apiPost } from "../../services/http/compatibility";

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
    // Redirect to backend OAuth endpoint
    window.location.href = "/api/v1/google/oauth/start";
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
   * Check if Google Calendar is connected
   */
  isConnected: (): boolean => {
    return document.cookie.includes("google_calendar_connected=true");
  },

  /**
   * Clear connection status
   */
  clearConnectionStatus: (): void => {
    document.cookie =
      "google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  },
};
