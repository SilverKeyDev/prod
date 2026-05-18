/**
 * Calendar type definitions
 */

export type {
  ExtendedGoogleEvent,
  ProfileAvailabilityEventMeta,
} from "packages/types/calendar/extendedGoogleEvent";

export interface DateRange {
  timeMin: string;
  timeMax: string;
}

export interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export type { CalendarGridDay, CalendarViewType } from "packages/types/calendar/calendarGrid";

/**
 * Calendar event stored in the database
 */
export interface CalendarEvent {
  id: string;
  user_id: string;
  calendar_id?: string | null;
  google_event_id?: string | null;
  summary: string;
  description?: string | null;
  location?: string | null;
  event_type?: string | null;
  creator_id: string;
  target_user_id?: string | null;
  shared_with_user_ids?: string[] | null;
  start_datetime: string; // ISO 8601 format
  end_datetime: string; // ISO 8601 format
  timezone: string;
  duration_minutes?: number | null;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }> | null;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  } | null;
  status: string;
  is_synced: boolean;
  last_synced_at?: string | null; // ISO 8601 format
  sync_source?: string | null;
  created_at?: string | null; // ISO 8601 format
  updated_at?: string | null; // ISO 8601 format
}
