import { describe, expect, it } from "vitest";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";

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
});
