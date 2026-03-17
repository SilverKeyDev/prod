import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

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
  const indexMap = new Map(items.map((it, i) => [it.id, i]));
  const sorted = [...items].sort((a, b) => {
    const orderA = a.order ?? indexMap.get(a.id) ?? 0;
    const orderB = b.order ?? indexMap.get(b.id) ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
  });
  for (const item of sorted) {
    if (!checked.has(item.id)) return item.id;
  }
  return null;
}
