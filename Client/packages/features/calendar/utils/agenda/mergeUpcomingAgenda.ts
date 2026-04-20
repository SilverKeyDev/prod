import { dateParseISO } from "packages/utils/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";
import { getEventStartDate } from "@/features/calendar/utils/parsing/eventParsing";

export type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";

/**
 * Todos use start-of-local-day for sorting so they align with the upcoming week window.
 */
export function todoAgendaSortTimestamp(todo: AgendaTodoDTO): number {
  if (todo.due_date == null || todo.due_date === "") {
    return Number.MAX_SAFE_INTEGER;
  }
  try {
    return dateParseISO(todo.due_date).startOf("day").valueOf();
  } catch {
    return Number.MAX_SAFE_INTEGER;
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
    if (t.due_date == null || t.due_date === "") {
      return true;
    }
    try {
      const dueMs = dateParseISO(t.due_date).valueOf();
      return dueMs >= minMs && dueMs <= maxMs;
    } catch {
      return false;
    }
  });
}

/**
 * Completed to-dos in full agenda / completed-only lists — due date descending; undated last; then title.
 */
export function sortCompletedAgendaTodosForDisplay(todos: AgendaTodoDTO[]): AgendaTodoDTO[] {
  return [...todos].sort((a, b) => {
    const aHas = a.due_date != null && a.due_date !== "";
    const bHas = b.due_date != null && b.due_date !== "";
    if (aHas && bHas) {
      try {
        const da = dateParseISO(a.due_date as string).valueOf();
        const db = dateParseISO(b.due_date as string).valueOf();
        if (db !== da) {
          return db - da;
        }
      } catch {
        /* fall through */
      }
    } else if (aHas !== bHas) {
      return aHas ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
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
