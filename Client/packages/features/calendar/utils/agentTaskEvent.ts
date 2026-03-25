import { dateNow, dayjs } from "packages/utils/date";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

/**
 * Timed Google Calendar event for agent agenda quick-add (same transport shape as
 * {@link CreateEventModal}: `dateTime` + `timeZone`). Uses a 1-hour default block at 9:00
 * local on the chosen day (or today) so server `validate_event_data` and DB extraction match
 * timed events.
 */
export function buildAgentTodoGoogleEvent(params: {
  title: string;
  /** Local calendar date YYYY-MM-DD, or null to anchor on today */
  deadlineDate: string | null;
  priority: string | null;
  calendarId: string;
}): GoogleEvent {
  const trimmed = params.title.trim();
  const parsedDeadline =
    params.deadlineDate != null && params.deadlineDate !== ""
      ? dayjs(params.deadlineDate, "YYYY-MM-DD", true)
      : null;
  const day = parsedDeadline?.isValid() ? parsedDeadline : dateNow();
  const start = day.startOf("day").add(9, "hour");
  const end = start.add(1, "hour");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const lines: string[] = [];
  if (params.priority) {
    lines.push(`Priority: ${params.priority}`);
  }
  lines.push("Added from SilverKey to-dos.");

  return {
    summary: trimmed,
    description: lines.join("\n"),
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
}
