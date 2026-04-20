import { describe, expect, it } from "vitest";

import { type AgendaTodoDTO, sortCompletedAgendaTodosForDisplay } from "packages/features/calendar";

describe("sortCompletedAgendaTodosForDisplay", () => {
  it("orders by due date descending, undated last, then title", () => {
    const todos: AgendaTodoDTO[] = [
      { id: "1", title: "B", due_date: "2026-01-10", completed: true },
      { id: "2", title: "A", due_date: "2026-01-20", completed: true },
      { id: "3", title: "Z no date", due_date: null, completed: true },
      { id: "4", title: "M no date", due_date: null, completed: true },
    ];
    const sorted = sortCompletedAgendaTodosForDisplay(todos);
    expect(sorted.map((t) => t.id)).toEqual(["2", "1", "4", "3"]);
  });
});
