import { describe, expect, it } from "vitest";

import { dateNow } from "packages/utils/core/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";

import { applyAgendaAllDisplayMode } from "./agendaAllDisplay";
import { getAgendaDisplayCategory } from "./agendaDisplayCategory";
import { agendaEventCompletionKey } from "./agendaEventCompletionKey";

function futureEvent(id: string): ExtendedGoogleEvent {
  const start = dateNow().add(2, "day");
  return {
    id,
    calendarId: "primary",
    summary: `Event ${id}`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: start.add(1, "hour").toISOString() },
  } as ExtendedGoogleEvent;
}

describe("applyAgendaAllDisplayMode future_only", () => {
  it("excludes agenda-marked-done events in future_only mode", () => {
    const event = futureEvent("e1");
    const key = agendaEventCompletionKey(event);
    const items = [{ kind: "event" as const, event }];
    const chronological = applyAgendaAllDisplayMode(items, "chronological", {
      completedEventKeys: { [key]: true },
    });
    expect(chronological).toHaveLength(1);

    const futureOnly = applyAgendaAllDisplayMode(items, "future_only", {
      completedEventKeys: { [key]: true },
    });
    expect(futureOnly).toHaveLength(0);
  });
});

describe("applyAgendaAllDisplayMode type-group sort", () => {
  const sameDay = "2026-06-10T12:00:00.000Z";

  function signingItem(): UpcomingAgendaItem {
    const todo: AgendaTodoDTO = {
      id: "sign-1",
      title: "Sign agreement",
      due_date: sameDay,
      completed: false,
      agenda_item_kind: "signing",
    };
    return { kind: "todo", todo };
  }

  function todoItem(): UpcomingAgendaItem {
    const todo: AgendaTodoDTO = {
      id: "todo-1",
      title: "Call client",
      due_date: sameDay,
      completed: false,
    };
    return { kind: "todo", todo };
  }

  function eventItem(): UpcomingAgendaItem {
    const event = {
      id: "evt-1",
      calendarId: "primary",
      summary: "Showing",
      start: { dateTime: sameDay },
      end: { dateTime: "2026-06-10T13:00:00.000Z" },
    } as ExtendedGoogleEvent;
    return { kind: "event", event };
  }

  it("orders signing before todo before event at the same timestamp", () => {
    const items = [eventItem(), todoItem(), signingItem()];
    const sorted = applyAgendaAllDisplayMode(items, "chronological");
    expect(sorted.map((i) => getAgendaDisplayCategory(i))).toEqual(["signing", "todo", "event"]);
  });

  it("preserves date order within the same type group", () => {
    const earlier: AgendaTodoDTO = {
      id: "todo-a",
      title: "Earlier",
      due_date: "2026-06-08T12:00:00.000Z",
      completed: false,
    };
    const later: AgendaTodoDTO = {
      id: "todo-b",
      title: "Later",
      due_date: "2026-06-12T12:00:00.000Z",
      completed: false,
    };
    const items: UpcomingAgendaItem[] = [
      { kind: "todo", todo: later },
      { kind: "todo", todo: earlier },
    ];
    const sorted = applyAgendaAllDisplayMode(items, "chronological");
    expect(sorted[0]?.kind).toBe("todo");
    if (sorted[0]?.kind === "todo") {
      expect(sorted[0].todo.id).toBe("todo-a");
    }
  });
});
