import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { sortTaskChecklistItems } from "./sortTaskChecklistItems";

function item(
  partial: Partial<TaskChecklistItem> & Pick<TaskChecklistItem, "id">
): TaskChecklistItem {
  return {
    label: partial.label ?? "",
    explanation: partial.explanation ?? "",
    ...partial,
  } as TaskChecklistItem;
}

describe("sortTaskChecklistItems", () => {
  it("orders by explicit order field", () => {
    const sorted = sortTaskChecklistItems([
      item({ id: 1, order: 30 }),
      item({ id: 2, order: 10 }),
      item({ id: 3, order: 20 }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("uses original index as tiebreaker when order is missing", () => {
    const sorted = sortTaskChecklistItems([item({ id: 10 }), item({ id: 20 }), item({ id: 30 })]);
    expect(sorted.map((i) => i.id)).toEqual([10, 20, 30]);
  });

  it("uses original index when order ties", () => {
    const sorted = sortTaskChecklistItems([
      item({ id: 3, order: 1 }),
      item({ id: 1, order: 1 }),
      item({ id: 2, order: 1 }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([3, 1, 2]);
  });
});
