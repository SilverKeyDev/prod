import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

/** Progressive disclosure applies when a phase has more than this many items (7+). */
export const PROGRESSIVE_CHECKLIST_ITEM_THRESHOLD = 6;

export const DEFAULT_CHECKLIST_PREVIEW_UPCOMING = 3;

export function shouldUseProgressiveDisclosure(itemCount: number): boolean {
  return itemCount > PROGRESSIVE_CHECKLIST_ITEM_THRESHOLD;
}

/**
 * Index of the active (first unchecked) item in sorted order, or `sortedItems.length` when all complete.
 */
export function getChecklistActiveIndex(
  sortedItems: TaskChecklistItem[],
  activeItemId: number | null
): number {
  if (activeItemId == null) return sortedItems.length;
  const idx = sortedItems.findIndex((it) => it.id === activeItemId);
  return idx >= 0 ? idx : sortedItems.length;
}

/** Items after the upcoming preview window (collapsed behind "Show N more"). */
export function getHiddenFutureItemCount(
  sortedItems: TaskChecklistItem[],
  activeItemId: number | null,
  previewUpcoming: number
): number {
  const activeIndex = getChecklistActiveIndex(sortedItems, activeItemId);
  const tailLen = Math.max(0, sortedItems.length - activeIndex - 1);
  return Math.max(0, tailLen - previewUpcoming);
}

export type ProgressiveChecklistSegment =
  | { kind: "completed_collapsed"; count: number }
  | { kind: "future_collapsed"; count: number }
  | { kind: "completed_item"; item: TaskChecklistItem; globalIndex: number }
  | { kind: "current"; item: TaskChecklistItem; globalIndex: number }
  | { kind: "upcoming"; item: TaskChecklistItem; globalIndex: number }
  | { kind: "future_item"; item: TaskChecklistItem; globalIndex: number }
  | { kind: "flat_item"; item: TaskChecklistItem; globalIndex: number };

export type BuildProgressiveChecklistRowsOptions = {
  previewUpcoming: number;
  futureOpen: boolean;
  /**
   * When set, this completed item is shown as a row even though the rest of
   * completed history stays collapsed (e.g. roadmap prerequisite reveal).
   */
  revealedCompletedItemId?: number | null;
  /**
   * When true, use segmented rows (collapsed completed prefix, current, preview upcoming, etc.)
   * even if the list is short. Used by the buyer roadmap so prior steps in a phase do not
   * each consume a full card when the phase has few items.
   */
  useProgressiveStructure?: boolean;
};

export function buildProgressiveChecklistRows(
  sortedItems: TaskChecklistItem[],
  activeItemId: number | null,
  options: BuildProgressiveChecklistRowsOptions
): ProgressiveChecklistSegment[] {
  const useRowSegments =
    options.useProgressiveStructure === true ||
    shouldUseProgressiveDisclosure(sortedItems.length);
  if (!useRowSegments) {
    return sortedItems.map((item, globalIndex) => ({
      kind: "flat_item" as const,
      item,
      globalIndex,
    }));
  }

  const activeIndex = getChecklistActiveIndex(sortedItems, activeItemId);
  const completed = sortedItems.slice(0, activeIndex);
  const current = activeIndex < sortedItems.length ? sortedItems[activeIndex] : undefined;
  const tail = sortedItems.slice(activeIndex + 1);
  const preview = tail.slice(0, options.previewUpcoming);
  const hiddenFuture = tail.slice(options.previewUpcoming);

  const segments: ProgressiveChecklistSegment[] = [];

  if (completed.length > 0) {
    const revealId = options.revealedCompletedItemId ?? null;
    const revealIdx = revealId != null ? completed.findIndex((it) => it.id === revealId) : -1;
    if (revealIdx >= 0) {
      const before = completed.slice(0, revealIdx);
      const revealed = completed[revealIdx]!;
      const after = completed.slice(revealIdx + 1);
      if (before.length > 0) {
        segments.push({ kind: "completed_collapsed", count: before.length });
      }
      segments.push({ kind: "completed_item", item: revealed, globalIndex: revealIdx });
      if (after.length > 0) {
        segments.push({ kind: "completed_collapsed", count: after.length });
      }
    } else {
      segments.push({ kind: "completed_collapsed", count: completed.length });
    }
  }

  if (current != null) {
    segments.push({ kind: "current", item: current, globalIndex: activeIndex });
  }

  for (let p = 0; p < preview.length; p++) {
    const item = preview[p]!;
    segments.push({
      kind: "upcoming",
      item,
      globalIndex: activeIndex + 1 + p,
    });
  }

  if (hiddenFuture.length > 0) {
    if (options.futureOpen) {
      hiddenFuture.forEach((item, i) => {
        segments.push({
          kind: "future_item",
          item,
          globalIndex: activeIndex + 1 + preview.length + i,
        });
      });
    } else {
      segments.push({ kind: "future_collapsed", count: hiddenFuture.length });
    }
  }

  return segments;
}
