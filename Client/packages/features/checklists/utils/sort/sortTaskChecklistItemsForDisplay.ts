import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { sortTaskChecklistItems } from "./sortTaskChecklistItems";

/**
 * Section list order for UI: completed steps first (template order within the group),
 * then incomplete steps (template order). Does not change merge or active-step logic.
 */
export function sortTaskChecklistItemsForDisplay<T extends TaskChecklistItem>(
  items: readonly T[],
  checkedIds: readonly number[]
): T[] {
  const checked = new Set(checkedIds);
  const templateOrder = sortTaskChecklistItems([...items]);
  const completed: T[] = [];
  const incomplete: T[] = [];
  for (const item of templateOrder) {
    if (checked.has(item.id)) {
      completed.push(item);
    } else {
      incomplete.push(item);
    }
  }
  return [...completed, ...incomplete];
}
