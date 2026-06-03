import { detectEventTypeFromTitle } from "packages/utils/calendar/parsing/detectEventTypeFromTitle";

import {
  type CalendarEventKindId,
  getCalendarEventKind,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";

/**
 * Default Meet toggle for Add to Agenda (create): off for property viewings / showing-style events.
 */
export function defaultGoogleMeetForCreate(input: {
  eventKindId: CalendarEventKindId;
  eventTitle: string;
}): boolean {
  const kind = getCalendarEventKind(input.eventKindId);
  if (kind.backendEventTypeHint === "property_viewing") {
    return false;
  }
  const titleHint = detectEventTypeFromTitle(input.eventTitle.trim());
  if (titleHint === "property_viewing") {
    return false;
  }
  return true;
}
