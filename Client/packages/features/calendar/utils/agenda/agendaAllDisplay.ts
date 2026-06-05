import { getEventStartDate } from "packages/utils/comms/calendar/parsing/eventParsing";
import { dateNow, dateParseISO } from "packages/utils/core/date";

import type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";
import { agendaEventCompletionKey } from "@/features/calendar/utils/agenda/agendaEventCompletionKey";

export type AgendaAllDisplayMode = "chronological" | "most_recent" | "future_only";

export const AGENDA_ALL_DISPLAY_OPTIONS: {
  value: AgendaAllDisplayMode;
  label: string;
}[] = [
  /** Nearest event start / task due day first — typical “what’s next” order. */
  { value: "chronological", label: "Date (earliest first)" },
  /** Farthest dates first — browse backward from the latest scheduled items. */
  { value: "most_recent", label: "Date (latest first)" },
  /** Hide past events and completed to-dos; keep open work and future-dated items. */
  { value: "future_only", label: "Incomplete and upcoming" },
];

/**
 * Single sort key for merged agenda rows: events by start, todos by due or * signing completion time, with undated open work treated as far-future.
 */
export function agendaItemSortMsForAllView(item: UpcomingAgendaItem): number {
  if (item.kind === "event") {
    return getEventStartDate(item.event)?.getTime() ?? 0;
  }
  const todo = item.todo;
  if (
    todo.agenda_item_kind === "signing" &&
    todo.completed &&
    todo.signing_completed_at != null &&
    todo.signing_completed_at !== ""
  ) {
    try {
      return dateParseISO(todo.signing_completed_at).valueOf();
    } catch {
      return 0;
    }
  }
  if (todo.due_date != null && todo.due_date !== "") {
    try {
      return dateParseISO(todo.due_date).startOf("day").valueOf();
    } catch {
      return 0;
    }
  }
  if (todo.completed) {
    return 0;
  }
  return Number.MAX_SAFE_INTEGER;
}

export type AgendaAllDisplayOptions = {
  completedEventKeys?: Record<string, true>;
};

function isAgendaItemFutureOnly(
  item: UpcomingAgendaItem,
  todayStartMs: number,
  completedEventKeys?: Record<string, true>
): boolean {
  if (item.kind === "event") {
    if (completedEventKeys?.[agendaEventCompletionKey(item.event)]) {
      return false;
    }
    const t = getEventStartDate(item.event)?.getTime() ?? 0;
    return t >= todayStartMs;
  }
  const todo = item.todo;
  if (todo.completed) {
    return false;
  }
  return agendaItemSortMsForAllView(item) >= todayStartMs;
}

function tieBreakKey(item: UpcomingAgendaItem): string {
  if (item.kind === "event") {
    const start = getEventStartDate(item.event)?.getTime() ?? "";
    return `e:${String(item.event.id ?? start)}`;
  }
  return `t:${item.todo.id}`;
}

export function applyAgendaAllDisplayMode(
  items: UpcomingAgendaItem[],
  mode: AgendaAllDisplayMode,
  options?: AgendaAllDisplayOptions
): UpcomingAgendaItem[] {
  const todayStartMs = dateNow().startOf("day").valueOf();
  const completedEventKeys = options?.completedEventKeys;
  const base =
    mode === "future_only"
      ? items.filter((i) => isAgendaItemFutureOnly(i, todayStartMs, completedEventKeys))
      : items;

  const descending = mode === "most_recent";

  return [...base].sort((a, b) => {
    const da = agendaItemSortMsForAllView(a);
    const db = agendaItemSortMsForAllView(b);
    if (da !== db) {
      return descending ? db - da : da - db;
    }
    return tieBreakKey(a).localeCompare(tieBreakKey(b));
  });
}
