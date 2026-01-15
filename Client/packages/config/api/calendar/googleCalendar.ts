/**
 * Google Calendar API client
 * Handles Google Calendar OAuth and API operations
 */

import { apiGet, apiPost, HttpError } from "../../../services/http/compatibility";

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
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
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
  calendarId?: string; // ID of the calendar this event belongs to
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

// API Client
export const googleCalendarApi = {
  /**
   * Start Google OAuth flow
   */
  startOAuth: async (useSchedulingScopes: boolean = false): Promise<void> => {
    // Redirect to backend OAuth endpoint
    const url = useSchedulingScopes
      ? "/api/v1/google/oauth/start?scheduling=true"
      : "/api/v1/google/oauth/start";
    window.location.href = url;
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
      return await apiGet<GoogleCalendarApiResponse<GoogleCalendarListResponse>>(
        "/api/v1/google/me/calendars",
      );
    } catch (error) {
      // If the error is an HttpError with a parsed body containing our error format, return it
      if (error instanceof HttpError && error.parsedBody) {
        const parsedBody = error.parsedBody as unknown;
        if (
          parsedBody &&
          typeof parsedBody === "object" &&
          "success" in parsedBody &&
          "error" in parsedBody
        ) {
          return parsedBody as GoogleCalendarApiResponse<GoogleCalendarListResponse>;
        }
      }
      // Otherwise, return a generic error response
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch calendars",
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
      // Extract error code from HttpError parsedBody if available
      if (error instanceof HttpError && error.parsedBody) {
        const parsedBody = error.parsedBody as { error?: string; message?: string };
        return {
          success: false,
          error: parsedBody.error || parsedBody.message || "Failed to list events",
        };
      }
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
      const { apiPatch } = await import("../../../services/http/compatibility");
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
      const { apiDelete } = await import("../../../services/http/compatibility");
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
    window.location.href = "/api/v1/google/oauth/start?full_scope=true";
  },

  /**
   * Create a secondary calendar
   */
  createCalendar: async (
    name: string,
  ): Promise<GoogleCalendarApiResponse<GoogleCalendar>> => {
    try {
      const response = await apiPost<
        GoogleCalendarApiResponse<GoogleCalendar>
      >("/api/v1/google/calendars", { name });
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
  ): Promise<GoogleCalendarApiResponse<any>> => {
    try {
      const response = await apiPost<GoogleCalendarApiResponse<any>>(
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
   * Check if Google Calendar is connected (checks backend)
   */
  isConnected: async (): Promise<boolean> => {
    try {
      const response = await apiGet<GoogleCalendarApiResponse<{ isConnected: boolean }>>(
        "/api/v1/google/connection-status",
      );
      return response.success && response.data?.isConnected === true;
    } catch (error) {
      // Fallback to cookie check
      return document.cookie.includes("google_calendar_connected=true");
    }
  },

  /**
   * Clear connection status
   */
  clearConnectionStatus: (): void => {
    document.cookie =
      "google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  },

  /**
   * Query free/busy information for calendars
   */
  queryFreebusy: async (
    request: import("../../../schemas/calendar/scheduling").FreebusyRequest,
  ): Promise<
    GoogleCalendarApiResponse<import("../../../schemas/calendar/scheduling").FreebusyResponse>
  > =>
    apiPost<
      GoogleCalendarApiResponse<import("../../../schemas/calendar/scheduling").FreebusyResponse>
    >("/api/v1/google/me/freebusy", request),

  /**
   * Get or create the SilverKey calendar
   */
  getOrCreateSilverKeyCalendar: async (
    buyerName?: string,
  ): Promise<GoogleCalendarApiResponse<GoogleCalendar>> =>
    apiPost<GoogleCalendarApiResponse<GoogleCalendar>>(
      "/api/v1/google/me/silverkey-calendar",
      {
        buyerName: buyerName,
      },
    ),

  /**
   * Get client availability (free/busy) for agents
   * Returns busy blocks without event details for privacy
   */
  getClientAvailability: async (
    clientId: string,
    timeMin: string,
    timeMax: string,
    calendarIds?: string[],
  ): Promise<
    GoogleCalendarApiResponse<import("../../../schemas/calendar/scheduling").FreebusyResponse>
  > => {
    try {
      const response = await apiPost<
        GoogleCalendarApiResponse<import("../../../schemas/calendar/scheduling").FreebusyResponse>
      >(`/api/v1/google/clients/${clientId}/availability`, {
        timeMin,
        timeMax,
        calendarIds: calendarIds || ["primary"],
      });
      return response;
    } catch (error) {
      // Extract error code from HttpError parsedBody if available
      if (error instanceof HttpError && error.parsedBody) {
        const parsedBody = error.parsedBody as { error?: string; message?: string };
        return {
          success: false,
          error: parsedBody.error || parsedBody.message || "Failed to get client availability",
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get client availability",
      };
    }
  },

  /**
   * Get client events for agents
   * Returns full event details for a client's calendar
   */
  getClientEvents: async (
    clientId: string,
    params?: {
      calendarId?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: string;
    }
  ): Promise<GoogleCalendarApiResponse<GoogleEventListResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.calendarId)
        queryParams.append("calendarId", params.calendarId);
      if (params?.timeMin) queryParams.append("timeMin", params.timeMin);
      if (params?.timeMax) queryParams.append("timeMax", params.timeMax);
      if (params?.maxResults)
        queryParams.append("maxResults", params.maxResults);

      const url = `/api/v1/google/clients/${clientId}/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response =
        await apiGet<GoogleCalendarApiResponse<GoogleEventListResponse>>(url);
      return response;
    } catch (error) {
      // Extract error code from HttpError parsedBody if available
      if (error instanceof HttpError && error.parsedBody) {
        const parsedBody = error.parsedBody as { error?: string; message?: string };
        return {
          success: false,
          error: parsedBody.error || parsedBody.message || "Failed to get client events",
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get client events",
      };
    }
  },

  /**
   * Get Google Calendar permissions status
   */
  getPermissions: async (): Promise<
    GoogleCalendarApiResponse<GoogleCalendarPermissionsResponse>
  > => {
    try {
      const response = await apiGet<
        GoogleCalendarApiResponse<GoogleCalendarPermissionsResponse>
      >("/api/v1/google/me/permissions");
      return response;
    } catch (error) {
      // Extract error code from HttpError parsedBody if available
      if (error instanceof HttpError && error.parsedBody) {
        const parsedBody = error.parsedBody as { error?: string; message?: string };
        return {
          success: false,
          error: parsedBody.error || parsedBody.message || "Failed to get permissions",
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get permissions",
      };
    }
  },
};
