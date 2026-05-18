import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { isSubmitGatedChecklistIntegration } from "packages/features/checklists/utils/rules/checklistIntegrationGating";
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

function pruneSelectable(checked: Set<number>, sortedItems: TaskChecklistItem[]): void {
  for (const item of sortedItems) {
    const iid = item.id;
    if (!checked.has(iid)) continue;
    if (autoWouldComplete(item, iid, checked)) continue;
    if (!isSubmitGatedChecklistIntegration(item)) continue;
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
    applyLocks(checked, sortedItems, oldChecked);
    pruneSelectable(checked, sortedItems);
    if (signature(checked) === before) break;
  }

  return [...checked].sort((a, b) => a - b);
}

/** Stable codes for logs and diagnostics (parity with server checklist_rules). */
export const MERGE_REASON_SIGNATURE_BASED = "signature_based";
export const MERGE_REASON_SELECTABLE_WHEN = "selectable_when";
export const MERGE_REASON_SEQUENTIAL_ORDER = "sequential_order";
export const MERGE_REASON_PRUNED = "pruned";

export type TaskChecklistMergeResult = {
  effectiveIds: number[];
  strippedRequestedIds: number[];
  strippedReasonCodes: string[];
};

function classifyStrippedId(
  iid: number,
  sortedItems: TaskChecklistItem[],
  idToItem: Map<number, TaskChecklistItem>,
  effective: ReadonlySet<number>
): string {
  const item = idToItem.get(iid);
  if (item == null) return MERGE_REASON_PRUNED;
  if (completionTypeRaw(item) === "signature_based") return MERGE_REASON_SIGNATURE_BASED;
  if (isSubmitGatedChecklistIntegration(item)) {
    const sel = item.selectable_when;
    if (sel != null && !evaluateChecklistCondition(sel, new Set(effective))) {
      return MERGE_REASON_SELECTABLE_WHEN;
    }
  }
  return MERGE_REASON_PRUNED;
}

/**
 * Run merge and return effective ids plus deterministic reasons for template ids
 * present in the request but absent after merge (parity with `apply_task_checklist_merge`).
 */
export function applyTaskChecklistMerge(
  items: TaskChecklistItem[],
  requestedIds: readonly number[],
  oldCheckedIds: ReadonlySet<number>
): TaskChecklistMergeResult {
  const valid = new Set(items.map((it) => it.id));
  const requestedValid = new Set(requestedIds.filter((id) => valid.has(id)));
  const requestedSorted = [...requestedValid].sort((a, b) => a - b);
  const effectiveList = mergeTaskChecklistCheckedIds(items, requestedSorted, oldCheckedIds);
  const effective = new Set(effectiveList);
  const strippedSorted = [...requestedValid].filter((x) => !effective.has(x)).sort((a, b) => a - b);
  const sortedItems = sortTaskChecklistItems([...items]);
  const idToItem = new Map(sortedItems.map((it) => [it.id, it]));
  const strippedReasonCodes = strippedSorted.map((id) =>
    classifyStrippedId(id, sortedItems, idToItem, effective)
  );
  return {
    effectiveIds: effectiveList,
    strippedRequestedIds: strippedSorted,
    strippedReasonCodes,
  };
}

export type ChecklistItemToggleEligibility = {
  /** User may check the box to mark the step complete (false when `completionRequiresSubmit`). */
  canCheck: boolean;
  /** User may clear a checked step when it was manually completable and not locked/auto-held. */
  canUncheck: boolean;
  /**
   * Unchecked step may be marked complete (checkbox or integration submit) when `selectable_when`
   * passes. Used for PUT/submit; manual checkbox uses `canCheck`.
   */
  canMarkChecked: boolean;
};

/**
 * UX-only eligibility (server enforces on PUT). `sectionUnlocked` is ignored for toggling so
 * buyers/agents may check steps in any phase; only submit-gated integrations keep submit rules.
 */
export function getChecklistItemToggleEligibility(
  items: TaskChecklistItem[],
  checkedIds: readonly number[],
  itemId: number,
  _sectionUnlocked: boolean
): ChecklistItemToggleEligibility {
  const sortedItems = sortTaskChecklistItems([...items]);
  const item = sortedItems.find((i) => i.id === itemId);
  if (item == null) {
    return { canCheck: false, canUncheck: false, canMarkChecked: false };
  }
  const checked = new Set(checkedIds);
  const isChecked = checked.has(itemId);

  if (item.completionType === "signature_based") {
    return { canCheck: false, canUncheck: false, canMarkChecked: false };
  }

  const submitGated = isSubmitGatedChecklistIntegration(item);
  const canMarkChecked =
    !isChecked && (submitGated ? evaluateChecklistCondition(item.selectable_when, checked) : true);

  const canCheck = canMarkChecked && !submitGated;

  const lockBlocksUncheck =
    item.lock_uncheck_when != null && evaluateChecklistCondition(item.lock_uncheck_when, checked);
  const canUncheck = isChecked && !lockBlocksUncheck && !autoWouldComplete(item, itemId, checked);

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
  _sectionUnlocked: boolean
): RoadmapChecklistBlockerKind | null {
  const item = sortedItems.find((i) => i.id === itemId);
  if (item == null || checkedIds.includes(itemId)) return null;

  const checked = new Set(checkedIds);

  if (item.completionType === "signature_based") {
    return { kind: "signature_pending" };
  }

  const submitGated = isSubmitGatedChecklistIntegration(item);
  const selOk = submitGated ? evaluateChecklistCondition(item.selectable_when, checked) : true;

  if (submitGated && selOk) {
    return { kind: "submit_via_integration" };
  }

  if (submitGated && !selOk) {
    if (item.selectable_when != null) {
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
