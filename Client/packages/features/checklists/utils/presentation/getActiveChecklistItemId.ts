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
  const checked = new Set(checkedIds);
  const sorted = sortTaskChecklistItems(items);
  for (const item of sorted) {
    if (!checked.has(item.id)) return item.id;
  }
  return null;
}
