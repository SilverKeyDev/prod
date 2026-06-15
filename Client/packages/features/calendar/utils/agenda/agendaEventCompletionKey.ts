import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

/** Stable key for client-persisted agenda "done" on a calendar event (not a Google delete). */
export function agendaEventCompletionKey(event: {
  id?: string | null;
  calendarId?: string | null;
}): string {
  const calendarId = event.calendarId ?? "primary";
  const eventId = event.id ?? "";
  return `${calendarId}:${eventId}`;
}

export function filterAgendaEventsExcludingCompleted(
  events: ExtendedGoogleEvent[],
  completedEventKeys: Record<string, true>
): ExtendedGoogleEvent[] {
  return events.filter((event) => !completedEventKeys[agendaEventCompletionKey(event)]);
}
