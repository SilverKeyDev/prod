import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

/**
 * Returns the EARLIEST unchecked item id in the section.
 * Items are ordered by explicit `order` when present, otherwise by array index.
 * Example: checked, unchecked, checked, unchecked → the first unchecked is active.
 */
export function getActiveChecklistItemId(
  items: TaskChecklistItem[],
  checkedIds: number[]
): number | null {
  const ids = getActiveChecklistItemIds(items, checkedIds);
  return ids[0] ?? null;
}

/**
 * Ids that should be highlighted and expanded as the current step(s).
 * When the first incomplete item has `parallel_step_group`, every unchecked item
 * in the same group (in sort order) is included; otherwise only that first id.
 */
export function getActiveChecklistItemIds(
  items: TaskChecklistItem[],
  checkedIds: number[]
): number[] {
  const checked = new Set(checkedIds);
  const sorted = sortTaskChecklistItems(items);
  const firstIncomplete = sorted.find((it) => !checked.has(it.id));
  if (firstIncomplete == null) return [];

  const group = firstIncomplete.parallel_step_group?.trim();
  if (group == null || group === "") {
    return [firstIncomplete.id];
  }

  return sorted
    .filter((it) => !checked.has(it.id) && (it.parallel_step_group?.trim() ?? "") === group)
    .map((it) => it.id);
}
