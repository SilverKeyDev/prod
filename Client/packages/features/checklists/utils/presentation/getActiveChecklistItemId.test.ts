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
      makeItem(3, 4, { parallel_step_group: "g" }),
    ];
    expect(getActiveChecklistItemIds(items, [1])).toEqual([5, 4, 2, 3]);
    expect(getActiveChecklistItemIds(items, [1, 5])).toEqual([4, 2, 3]);
    expect(getActiveChecklistItemIds(items, [1, 5, 4, 2])).toEqual([3]);
    expect(getActiveChecklistItemIds(items, [1, 5, 4, 2, 3])).toEqual([]);
  });

  it("returns empty when all complete", () => {
    const items = [makeItem(1, 0)];
    expect(getActiveChecklistItemIds(items, [1])).toEqual([]);
  });

  it("includes partner agent in search parallel integration wave", () => {
    const items = [
      makeItem(5, 0, { parallel_step_group: "search_parallel_integrations" }),
      makeItem(4, 1, { parallel_step_group: "search_parallel_integrations" }),
      makeItem(2, 2, { parallel_step_group: "search_parallel_integrations" }),
      makeItem(1, 3),
      makeItem(3, 4, { parallel_step_group: "search_parallel_integrations" }),
      makeItem(6, 5),
    ];
    expect(getActiveChecklistItemIds(items, [])).toEqual([5, 4, 2, 3]);
    expect(getActiveChecklistItemIds(items, [5, 4, 2, 3])).toEqual([1]);
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
