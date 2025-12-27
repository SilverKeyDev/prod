/**
 * Scheduling schema types for Google Calendar scheduling MVP
 */

export interface FreebusyRequest {
  timeMin: string; // ISO 8601
  timeMax: string; // ISO 8601
  calendarIds?: string[]; // defaults to ["primary"]
}

export interface FreebusyTimeBlock {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export interface FreebusyResponse {
  calendars: Record<string, {
    busy: FreebusyTimeBlock[];
  }>;
}

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
}

export interface WorkingHours {
  start: number; // Hour in 24-hour format (0-23)
  end: number; // Hour in 24-hour format (0-23)
}

