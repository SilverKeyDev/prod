import { inclusiveRangeToGoogleAllDayDates } from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import { dayjs } from "packages/utils/core/date";

import type { GoogleCalendarEventCreateBody } from "@/features/calendar/types/googleEvent";

const HH_MM_REGEX = /^(\d{1,2}):(\d{2})$/;

/**
 * Parses optional agenda time from UI (`<input type="time">` uses HH:mm).
 * Returns null if empty or invalid.
 */
export function parseAgendaDeadlineTime(raw: string | null | undefined): {
  hour: number;
  minute: number;
} | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }
  const match = raw.trim().match(HH_MM_REGEX);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

/**
 * Google Calendar event for agent agenda quick-add.
 * - With optional time: timed block (`dateTime` + `timeZone`), 1 hour duration (same shape as CreateEventModal).
 * - Without time: all-day (`start.date` / `end.date` exclusive next day), matching server `validate_event_data`.
 */
export function buildAgentTodoGoogleEvent(params: {
  title: string;
  /** Local calendar date YYYY-MM-DD (required) */
  deadlineDate: string;
  /** Local time HH:mm, or null/empty for an all-day event */
  deadlineTime: string | null;
  calendarId: string;
  /** Optional user-facing notes; appended above the SilverKey footer in the event body */
  description?: string | null;
  /** Optional Google Meet on create (timed calendar insert only). */
  addGoogleMeet?: boolean;
}): GoogleCalendarEventCreateBody {
  const trimmed = params.title.trim();
  const parsedDeadline = dayjs(params.deadlineDate.trim(), "YYYY-MM-DD", true);
  if (!parsedDeadline.isValid()) {
    throw new Error("Agenda calendar event requires a valid date (YYYY-MM-DD).");
  }
  const day = parsedDeadline.startOf("day");
  const timeParts = parseAgendaDeadlineTime(params.deadlineTime);

  const footer = "Added from SilverKey to-dos.";
  const userNotes = params.description?.trim();
  const description = userNotes ? `${userNotes}\n\n${footer}` : footer;

  if (timeParts) {
    const start = day.hour(timeParts.hour).minute(timeParts.minute).second(0).millisecond(0);
    const end = start.add(1, "hour");
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body: GoogleCalendarEventCreateBody = {
      summary: trimmed,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone,
      },
      calendarId: params.calendarId,
    };
    if (params.addGoogleMeet) {
      body.addGoogleMeet = true;
    }
    return body;
  }

  const ymd = day.format("YYYY-MM-DD");
  const { startDate, endDateExclusive } = inclusiveRangeToGoogleAllDayDates(ymd, ymd);
  const body: GoogleCalendarEventCreateBody = {
    summary: trimmed,
    description,
    start: { date: startDate },
    end: { date: endDateExclusive },
    calendarId: params.calendarId,
  };
  return body;
}
