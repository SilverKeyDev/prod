import { describe, expect, it } from "vitest";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { getAgendaDisplayCategory } from "./agendaDisplayCategory";
import { filterTodosInRange, mergeUpcomingAgendaItems } from "./mergeUpcomingAgenda";

describe("compact agenda merge", () => {
  const timeMin = "2026-06-01T00:00:00.000Z";
  const timeMax = "2026-06-15T23:59:59.999Z";

  it("excludes completed todos from merged compact list", () => {
    const todos: AgendaTodoDTO[] = [
      { id: "1", title: "Open", due_date: "2026-06-05T12:00:00.000Z", completed: false },
      { id: "2", title: "Done", due_date: "2026-06-06T12:00:00.000Z", completed: true },
    ];
    const inRange = filterTodosInRange(todos, timeMin, timeMax);
    const incomplete = inRange.filter((t) => !t.completed);
    const merged = mergeUpcomingAgendaItems([], incomplete);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.kind).toBe("todo");
    if (merged[0]?.kind === "todo") {
      expect(merged[0].todo.id).toBe("1");
    }
  });

  it("orders signing before todo before event in compact merge", () => {
    const sameDay = "2026-06-05T12:00:00.000Z";
    const signing: AgendaTodoDTO = {
      id: "sign",
      title: "Sign",
      due_date: sameDay,
      completed: false,
      agenda_item_kind: "signing",
    };
    const todo: AgendaTodoDTO = {
      id: "todo",
      title: "Task",
      due_date: sameDay,
      completed: false,
    };
    const event = {
      id: "evt",
      calendarId: "primary",
      summary: "Meeting",
      start: { dateTime: sameDay },
      end: { dateTime: "2026-06-05T13:00:00.000Z" },
    } as ExtendedGoogleEvent;

    const merged = mergeUpcomingAgendaItems([event], [signing, todo]);
    expect(merged.map((i) => getAgendaDisplayCategory(i))).toEqual(["signing", "todo", "event"]);
  });
});
