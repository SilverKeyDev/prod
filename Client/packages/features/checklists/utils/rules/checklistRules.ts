import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

export function evaluateChecklistCondition(
  cond: TaskChecklistItem["selectable_when"],
  checked: ReadonlySet<number>
): boolean {
  if (cond == null) return true;
  const { kind, item_ids: itemIds } = cond;
  if (kind === "all_items_checked") {
    return itemIds.every((id) => checked.has(id));
  }
  if (kind === "any_item_checked") {
    return itemIds.some((id) => checked.has(id));
  }
  return false;
}

function autoWouldComplete(
  item: TaskChecklistItem,
  iid: number,
  checked: ReadonlySet<number>
): boolean {
  const cond = item.auto_complete_when;
  if (cond == null) return false;
  const without = new Set(checked);
  without.delete(iid);
  return evaluateChecklistCondition(cond, without);
}

function applyAutoComplete(checked: Set<number>, sortedItems: TaskChecklistItem[]): void {
  for (;;) {
    const before = checked.size;
    for (const item of sortedItems) {
      const iid = item.id;
      if (checked.has(iid)) continue;
      const cond = item.auto_complete_when;
      if (cond != null && evaluateChecklistCondition(cond, checked)) {
        checked.add(iid);
      }
    }
    if (checked.size === before) break;
  }
}

function applyLocks(
  checked: Set<number>,
  sortedItems: TaskChecklistItem[],
  oldChecked: ReadonlySet<number>
): void {
  for (const item of sortedItems) {
    const cond = item.lock_uncheck_when;
    if (cond == null) continue;
    const iid = item.id;
    if (oldChecked.has(iid) && evaluateChecklistCondition(cond, checked)) {
      checked.add(iid);
    }
  }
}

function completionTypeRaw(item: TaskChecklistItem): string {
  const raw =
    (item as { completionType?: string; completion_type?: string }).completionType ??
    (item as { completion_type?: string }).completion_type ??
    "";
  return String(raw);
}

/** Re-add ids already stored as checked; users cannot remove progress via PUT (prune steps may still fix invalid sets). */
function applyPersistedCheckedIds(
  checked: Set<number>,
  sortedItems: TaskChecklistItem[],
  oldChecked: ReadonlySet<number>
): void {
  const byId = new Map(sortedItems.map((it) => [it.id, it]));
  for (const iid of oldChecked) {
    const item = byId.get(iid);
    if (item == null) continue;
    if (completionTypeRaw(item) === "signature_based") continue;
    checked.add(iid);
  }
}

function pruneSequential(checked: Set<number>, sortedItems: TaskChecklistItem[]): void {
  for (;;) {
    let changed = false;
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]!;
      const iid = item.id;
      if (!checked.has(iid)) continue;
      if (item.allow_unordered_check) continue;
      for (let j = 0; j < i; j++) {
        const prevId = sortedItems[j]!.id;
        if (!checked.has(prevId)) {
          checked.delete(iid);
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }
}

function pruneSelectable(checked: Set<number>, sortedItems: TaskChecklistItem[]): void {
  for (const item of sortedItems) {
    const iid = item.id;
    if (!checked.has(iid)) continue;
    if (autoWouldComplete(item, iid, checked)) continue;
    const sel = item.selectable_when;
    if (sel != null) {
      const without = new Set(checked);
      without.delete(iid);
      if (!evaluateChecklistCondition(sel, without)) {
        checked.delete(iid);
      }
    }
  }
}

/**
 * Mirrors `Server/app/services/transactions/checklist_rules.merge_task_checklist_checked_ids`.
 */
export function mergeTaskChecklistCheckedIds(
  items: TaskChecklistItem[],
  requestedIds: readonly number[],
  oldCheckedIds: ReadonlySet<number>
): number[] {
  const valid = new Set(items.map((it) => it.id));
  const req = new Set(requestedIds.filter((id) => valid.has(id)));
  for (const it of items) {
    if (it.completionType === "signature_based") {
      req.delete(it.id);
    }
  }
  const oldChecked = new Set([...oldCheckedIds].filter((id) => valid.has(id)));
  const sortedItems = sortTaskChecklistItems([...items]);
  const checked = new Set(req);

  const signature = (s: Set<number>) => [...s].sort((a, b) => a - b).join(",");
  const maxIter = sortedItems.length * 6 + 12;
  for (let n = 0; n < maxIter; n++) {
    const before = signature(checked);
    applyAutoComplete(checked, sortedItems);
    applyPersistedCheckedIds(checked, sortedItems, oldChecked);
    applyLocks(checked, sortedItems, oldChecked);
    pruneSequential(checked, sortedItems);
    pruneSelectable(checked, sortedItems);
    if (signature(checked) === before) break;
  }

  return [...checked].sort((a, b) => a - b);
}

export function passesSequentialForCheck(
  sortedItems: TaskChecklistItem[],
  checked: ReadonlySet<number>,
  item: TaskChecklistItem
): boolean {
  if (item.allow_unordered_check) return true;
  const idx = sortedItems.findIndex((i) => i.id === item.id);
  if (idx < 0) return false;
  for (let i = 0; i < idx; i++) {
    if (!checked.has(sortedItems[i]!.id)) return false;
  }
  return true;
}

export type ChecklistItemToggleEligibility = {
  /** User may check the box to mark the step complete (false when `completionRequiresSubmit`). */
  canCheck: boolean;
  /** Always false: completed steps cannot be cleared from the checklist UI. */
  canUncheck: boolean;
  /**
   * Unchecked step may be marked complete (checkbox or integration submit) when sequential
   * gates and `selectable_when` pass. Used for PUT/submit; manual checkbox uses `canCheck`.
   */
  canMarkChecked: boolean;
};

/**
 * UX-only eligibility (server enforces on PUT). `sectionUnlocked` is the buyer-roadmap section gate.
 */
export function getChecklistItemToggleEligibility(
  items: TaskChecklistItem[],
  checkedIds: readonly number[],
  itemId: number,
  sectionUnlocked: boolean
): ChecklistItemToggleEligibility {
  const sortedItems = sortTaskChecklistItems([...items]);
  const item = sortedItems.find((i) => i.id === itemId);
  if (item == null) {
    return { canCheck: false, canUncheck: false, canMarkChecked: false };
  }
  const checked = new Set(checkedIds);
  const isChecked = checked.has(itemId);

  if (!sectionUnlocked) {
    return { canCheck: false, canUncheck: false, canMarkChecked: false };
  }

  if (item.completionType === "signature_based") {
    return { canCheck: false, canUncheck: false, canMarkChecked: false };
  }

  const canMarkChecked =
    !isChecked &&
    passesSequentialForCheck(sortedItems, checked, item) &&
    evaluateChecklistCondition(item.selectable_when, checked);

  const submitOnly = item.completionRequiresSubmit === true;
  const canCheck = canMarkChecked && !submitOnly;

  /** Checked steps cannot be cleared from the UI; server merge also re-adds stored ids (see sticky merge). */
  const canUncheck = false;

  return { canCheck, canUncheck, canMarkChecked };
}

/** UX hint for buyer roadmap rows that cannot be checked yet (replaces lock icon + dead-end copy). */
export type RoadmapChecklistBlockerKind =
  | {
      kind: "prerequisite_item";
      blockerItemId: number;
      blockerLabel: string;
      /**
       * When false, the row stays tappable/handoff but does not repeat the blocker step title inline
       * (used for `selectable_when` gates like Search parallel steps until pre-approval).
       */
      showInlinePrerequisiteLabel: boolean;
    }
  | { kind: "section_gate" }
  | { kind: "submit_via_integration" }
  | { kind: "signature_pending" };

function sortedIndexById(sortedItems: TaskChecklistItem[], id: number): number {
  const idx = sortedItems.findIndex((i) => i.id === id);
  return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
}

function firstUnsatisfiedSelectableDependency(
  sortedItems: TaskChecklistItem[],
  checked: ReadonlySet<number>,
  cond: NonNullable<TaskChecklistItem["selectable_when"]>
): TaskChecklistItem | null {
  const byId = new Map(sortedItems.map((i) => [i.id, i]));
  if (cond.kind === "all_items_checked") {
    const uncheckedIds = cond.item_ids.filter((id) => !checked.has(id));
    const ordered = [...uncheckedIds].sort(
      (a, b) => sortedIndexById(sortedItems, a) - sortedIndexById(sortedItems, b)
    );
    const id = ordered[0];
    return id != null ? (byId.get(id) ?? null) : null;
  }
  if (cond.kind === "any_item_checked") {
    if (cond.item_ids.some((id) => checked.has(id))) return null;
    const ordered = [...cond.item_ids].sort(
      (a, b) => sortedIndexById(sortedItems, a) - sortedIndexById(sortedItems, b)
    );
    const id = ordered[0];
    return id != null ? (byId.get(id) ?? null) : null;
  }
  return null;
}

/**
 * When an unchecked step cannot be manually checked, describes what the buyer should do next.
 * Returns `null` when the row does not need the roadmap handoff pattern.
 */
export function getRoadmapChecklistItemBlockerKind(
  sortedItems: TaskChecklistItem[],
  checkedIds: readonly number[],
  itemId: number,
  sectionUnlocked: boolean
): RoadmapChecklistBlockerKind | null {
  const item = sortedItems.find((i) => i.id === itemId);
  if (item == null || checkedIds.includes(itemId)) return null;

  if (!sectionUnlocked) {
    return { kind: "section_gate" };
  }

  const checked = new Set(checkedIds);

  if (item.completionType === "signature_based") {
    return { kind: "signature_pending" };
  }

  const passesSeq = passesSequentialForCheck(sortedItems, checked, item);
  const selOk = evaluateChecklistCondition(item.selectable_when, checked);
  const canMarkChecked = passesSeq && selOk;

  if (canMarkChecked && item.completionRequiresSubmit === true) {
    return { kind: "submit_via_integration" };
  }

  if (!canMarkChecked) {
    if (!passesSeq && !item.allow_unordered_check) {
      const idx = sortedItems.findIndex((i) => i.id === itemId);
      if (idx > 0) {
        for (let i = 0; i < idx; i++) {
          const prev = sortedItems[i]!;
          if (!checked.has(prev.id)) {
            return {
              kind: "prerequisite_item",
              blockerItemId: prev.id,
              blockerLabel: prev.label,
              showInlinePrerequisiteLabel: true,
            };
          }
        }
      }
    }
    if (!selOk && item.selectable_when != null) {
      const dep = firstUnsatisfiedSelectableDependency(sortedItems, checked, item.selectable_when);
      if (dep != null) {
        return {
          kind: "prerequisite_item",
          blockerItemId: dep.id,
          blockerLabel: dep.label,
          showInlinePrerequisiteLabel: false,
        };
      }
    }
    return { kind: "signature_pending" };
  }

  return null;
}
