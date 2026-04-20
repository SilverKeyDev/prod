import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

/**
 * Stable checklist ordering: explicit `order` when present, otherwise original array index.
 * Matches ordering used by `getActiveChecklistItemId` and buyer roadmap UIs.
 */
export function sortTaskChecklistItems<T extends TaskChecklistItem>(items: T[]): T[] {
  const indexMap = new Map(items.map((it, i) => [it.id, i]));
  return [...items].sort((a, b) => {
    const orderA = a.order ?? indexMap.get(a.id) ?? 0;
    const orderB = b.order ?? indexMap.get(b.id) ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
  });
}
