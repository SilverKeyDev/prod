import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { sortTaskChecklistItemsForDisplay } from "./sortTaskChecklistItemsForDisplay";

function item(id: number, order?: number): TaskChecklistItem {
  return {
    id,
    label: `L${id}`,
    explanation: "",
    order: order ?? null,
  };
}

describe("sortTaskChecklistItemsForDisplay", () => {
  it("places completed items before incomplete while preserving template order in each group", () => {
    const items = [item(3, 2), item(1, 0), item(2, 1)];
    expect(sortTaskChecklistItemsForDisplay(items, [2, 3])).toEqual([
      item(2, 1),
      item(3, 2),
      item(1, 0),
    ]);
  });

  it("returns template order when nothing is checked", () => {
    const items = [item(2, 1), item(1, 0)];
    expect(sortTaskChecklistItemsForDisplay(items, [])).toEqual([item(1, 0), item(2, 1)]);
  });

  it("returns template order when all are checked", () => {
    const items = [item(2, 1), item(1, 0)];
    expect(sortTaskChecklistItemsForDisplay(items, [1, 2])).toEqual([item(1, 0), item(2, 1)]);
  });
});
