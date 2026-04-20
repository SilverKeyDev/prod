/**
 * Scheduling types for Google Calendar scheduling MVP.
 * Free/busy API types are aliases of OpenAPI-generated schemas (api.generated.ts).
 */

import type { components } from "packages/types/api.generated";

export type FreebusyRequest = components["schemas"]["FreebusyRequest"];
export type FreebusyResponse = components["schemas"]["FreebusyResponse"];
export type ViewingItinerary = components["schemas"]["ViewingItinerary"];

/** Busy interval as returned under each calendar in a Freebusy response. */
type FreebusyCalendarEntry = FreebusyResponse["calendars"][string];
export type FreebusyTimeBlock = NonNullable<NonNullable<FreebusyCalendarEntry["busy"]>[number]>;

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
}

export interface ScheduleEventRequest {
  summary: string;
  description?: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  calendarId?: string; // SilverKey calendar ID
  itinerary?: ViewingItinerary;
}

export interface WorkingHours {
  start: number; // Hour in 24-hour format (0-23)
  end: number; // Hour in 24-hour format (0-23)
}
