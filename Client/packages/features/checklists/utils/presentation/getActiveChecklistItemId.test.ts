import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { getActiveChecklistItemId, getActiveChecklistItemIds } from "./getActiveChecklistItemId";

function makeItem(
  id: number,
  order: number,
  extra: Partial<TaskChecklistItem> = {}
): TaskChecklistItem {
  return {
    id,
    label: `L${id}`,
    explanation: "",
    order,
    ...extra,
  };
}

describe("getActiveChecklistItemIds", () => {
  it("returns a single id when no parallel_step_group", () => {
    const items = [makeItem(1, 0), makeItem(2, 1)];
    expect(getActiveChecklistItemIds(items, [])).toEqual([1]);
    expect(getActiveChecklistItemIds(items, [1])).toEqual([2]);
  });

  it("returns all unchecked ids in the same parallel group", () => {
    const items = [
      makeItem(1, 0),
      makeItem(5, 1, { parallel_step_group: "g" }),
      makeItem(4, 2, { parallel_step_group: "g" }),
      makeItem(2, 3, { parallel_step_group: "g" }),
      makeItem(3, 4),
    ];
    expect(getActiveChecklistItemIds(items, [1])).toEqual([5, 4, 2]);
    expect(getActiveChecklistItemIds(items, [1, 5])).toEqual([4, 2]);
    expect(getActiveChecklistItemIds(items, [1, 5, 4, 2])).toEqual([3]);
  });

  it("returns empty when all complete", () => {
    const items = [makeItem(1, 0)];
    expect(getActiveChecklistItemIds(items, [1])).toEqual([]);
  });
});

describe("getActiveChecklistItemId", () => {
  it("matches first id in getActiveChecklistItemIds", () => {
    const items = [
      makeItem(1, 0),
      makeItem(5, 1, { parallel_step_group: "g" }),
      makeItem(4, 2, { parallel_step_group: "g" }),
    ];
    expect(getActiveChecklistItemId(items, [1])).toBe(5);
  });
});
