import { describe, expect, it } from "vitest";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";

import { filterAgendaByDisplayCategories, getAgendaDisplayCategory } from "./agendaDisplayCategory";

function signingTodo(id: string): UpcomingAgendaItem {
  const todo: AgendaTodoDTO = {
    id,
    title: `Sign ${id}`,
    due_date: null,
    completed: false,
    agenda_item_kind: "signing",
  };
  return { kind: "todo", todo };
}

function regularTodo(id: string): UpcomingAgendaItem {
  const todo: AgendaTodoDTO = {
    id,
    title: `Todo ${id}`,
    due_date: "2026-06-10T12:00:00.000Z",
    completed: false,
  };
  return { kind: "todo", todo };
}

function calendarEvent(id: string): UpcomingAgendaItem {
  const event = {
    id,
    calendarId: "primary",
    summary: `Event ${id}`,
    start: { dateTime: "2026-06-10T14:00:00.000Z" },
    end: { dateTime: "2026-06-10T15:00:00.000Z" },
  } as ExtendedGoogleEvent;
  return { kind: "event", event };
}

describe("getAgendaDisplayCategory", () => {
  it("resolves signing, todo, and event categories", () => {
    expect(getAgendaDisplayCategory(signingTodo("s1"))).toBe("signing");
    expect(getAgendaDisplayCategory(regularTodo("t1"))).toBe("todo");
    expect(getAgendaDisplayCategory(calendarEvent("e1"))).toBe("event");
  });
});

describe("filterAgendaByDisplayCategories", () => {
  const items = [signingTodo("s1"), regularTodo("t1"), calendarEvent("e1")];

  it("returns empty when no categories selected", () => {
    expect(filterAgendaByDisplayCategories(items, new Set())).toEqual([]);
  });

  it("keeps only selected categories", () => {
    const filtered = filterAgendaByDisplayCategories(items, new Set(["signing", "event"]));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((i) => getAgendaDisplayCategory(i))).toEqual(["signing", "event"]);
  });
});
