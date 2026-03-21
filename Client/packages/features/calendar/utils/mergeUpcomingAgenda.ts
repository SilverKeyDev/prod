import { dateParseISO } from "packages/utils/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { getEventStartDate } from "./eventParsing";

export type UpcomingAgendaItem =
  | { kind: "event"; event: ExtendedGoogleEvent }
  | { kind: "todo"; todo: AgendaTodoDTO };

/**
 * Todos use start-of-local-day for sorting so they align with the upcoming week window.
 */
export function todoAgendaSortTimestamp(todo: AgendaTodoDTO): number {
  try {
    return dateParseISO(todo.due_date).startOf("day").valueOf();
  } catch {
    return 0;
  }
}

/**
 * Keep todos whose due instant falls within [timeMin, timeMax] (ISO), inclusive.
 */
export function filterTodosInRange(
  todos: AgendaTodoDTO[],
  timeMin: string,
  timeMax: string
): AgendaTodoDTO[] {
  let minMs: number;
  let maxMs: number;
  try {
    minMs = dateParseISO(timeMin).valueOf();
    maxMs = dateParseISO(timeMax).valueOf();
  } catch {
    return [];
  }

  return todos.filter((t) => {
    try {
      const dueMs = dateParseISO(t.due_date).valueOf();
      return dueMs >= minMs && dueMs <= maxMs;
    } catch {
      return false;
    }
  });
}

export function mergeUpcomingAgendaItems(
  events: ExtendedGoogleEvent[],
  todos: AgendaTodoDTO[]
): UpcomingAgendaItem[] {
  const items: UpcomingAgendaItem[] = [
    ...events.map((event) => ({ kind: "event" as const, event })),
    ...todos.map((todo) => ({ kind: "todo" as const, todo })),
  ];

  return items.sort((a, b) => {
    const ta =
      a.kind === "event"
        ? (getEventStartDate(a.event)?.getTime() ?? Number.MAX_SAFE_INTEGER)
        : todoAgendaSortTimestamp(a.todo);
    const tb =
      b.kind === "event"
        ? (getEventStartDate(b.event)?.getTime() ?? Number.MAX_SAFE_INTEGER)
        : todoAgendaSortTimestamp(b.todo);
    return ta - tb;
  });
}
