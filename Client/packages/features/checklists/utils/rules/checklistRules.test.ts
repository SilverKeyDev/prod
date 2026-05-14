import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

import {
  applyTaskChecklistMerge,
  evaluateChecklistCondition,
  getChecklistItemToggleEligibility,
  MERGE_REASON_SELECTABLE_WHEN,
  MERGE_REASON_SIGNATURE_BASED,
  mergeTaskChecklistCheckedIds,
} from "./checklistRules";

function item(
  partial: Partial<TaskChecklistItem> & Pick<TaskChecklistItem, "id" | "label" | "explanation">
): TaskChecklistItem {
  return {
    label: partial.label,
    explanation: partial.explanation,
    ...partial,
  };
}

describe("evaluateChecklistCondition", () => {
  it("all_items_checked is vacuously true for empty item_ids", () => {
    const checked = new Set<number>([1]);
    expect(evaluateChecklistCondition({ kind: "all_items_checked", item_ids: [] }, checked)).toBe(
      true
    );
  });

  it("any_item_checked is false for empty item_ids", () => {
    expect(
      evaluateChecklistCondition({ kind: "any_item_checked", item_ids: [] }, new Set([1]))
    ).toBe(false);
  });

  it("all_items_checked requires every id", () => {
    const cond = { kind: "all_items_checked" as const, item_ids: [1, 2] };
    expect(evaluateChecklistCondition(cond, new Set([1]))).toBe(false);
    expect(evaluateChecklistCondition(cond, new Set([1, 2]))).toBe(true);
  });

  it("any_item_checked requires at least one", () => {
    const cond = { kind: "any_item_checked" as const, item_ids: [1, 2] };
    expect(evaluateChecklistCondition(cond, new Set<number>())).toBe(false);
    expect(evaluateChecklistCondition(cond, new Set([2]))).toBe(true);
  });
});

describe("mergeTaskChecklistCheckedIds", () => {
  it("auto-completes when condition holds", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "B",
        explanation: "",
        allow_unordered_check: true,
        auto_complete_when: {
          kind: "all_items_checked",
          item_ids: [1],
        },
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [1], new Set());
    expect(merged).toEqual([1, 2]);
  });

  it("re-adds locked id when client omits it", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "B",
        explanation: "",
        allow_unordered_check: true,
        lock_uncheck_when: {
          kind: "all_items_checked",
          item_ids: [1],
        },
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [1], new Set([1, 2]));
    expect(merged).toEqual([1, 2]);
  });

  it("re-adds previously checked ids without lock_uncheck_when", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "B",
        explanation: "",
        allow_unordered_check: true,
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [1], new Set([1, 2]));
    expect(merged).toEqual([1, 2]);
  });

  it("strips manual check when selectable_when fails", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "B",
        explanation: "",
        allow_unordered_check: true,
        selectable_when: {
          kind: "all_items_checked",
          item_ids: [1],
        },
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [2], new Set());
    expect(merged).toEqual([]);
  });

  it("does not keep client-requested signature_based ids in the merged set", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 6,
        order: 1,
        label: "Sign",
        explanation: "",
        allow_unordered_check: true,
        completionType: "signature_based",
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [1, 6], new Set());
    expect(merged).toEqual([1]);
  });
});

describe("getChecklistItemToggleEligibility", () => {
  const items: TaskChecklistItem[] = [
    item({
      id: 1,
      order: 0,
      label: "A",
      explanation: "",
    }),
    item({
      id: 2,
      order: 1,
      label: "B",
      explanation: "",
      lock_uncheck_when: {
        kind: "all_items_checked",
        item_ids: [1],
      },
    }),
  ];

  it("blocks uncheck when lock condition holds", () => {
    const e = getChecklistItemToggleEligibility(items, [1, 2], 2, true);
    expect(e.canUncheck).toBe(false);
    expect(e.canCheck).toBe(false);
  });

  it("never allows uncheck once a step is checked", () => {
    const e = getChecklistItemToggleEligibility(items, [2], 2, true);
    expect(e.canUncheck).toBe(false);
  });

  it("signature_based disables all manual toggle paths", () => {
    const sig: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
      }),
      item({
        id: 6,
        order: 1,
        label: "Sign",
        explanation: "",
        completionType: "signature_based",
      }),
    ];
    const e = getChecklistItemToggleEligibility(sig, [1], 6, true);
    expect(e.canCheck).toBe(false);
    expect(e.canUncheck).toBe(false);
    expect(e.canMarkChecked).toBe(false);
  });

  it("completionRequiresSubmit disables manual check but allows mark-checked", () => {
    const withSubmit: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "A",
        explanation: "",
      }),
      item({
        id: 2,
        order: 1,
        label: "B",
        explanation: "",
        completionRequiresSubmit: true,
      }),
    ];
    const e = getChecklistItemToggleEligibility(withSubmit, [1], 2, true);
    expect(e.canMarkChecked).toBe(true);
    expect(e.canCheck).toBe(false);
  });

  it("matches mergeTaskChecklistCheckedIds order when items omit explicit order (API index order)", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 99,
        label: "Appears first in API array",
        explanation: "",
      }),
      item({
        id: 77,
        label: "Appears second in API array",
        explanation: "",
      }),
    ];
    const sorted = sortTaskChecklistItems(items);
    expect(sorted.map((i) => i.id)).toEqual([99, 77]);

    expect(getChecklistItemToggleEligibility(sorted, [], 77, true).canMarkChecked).toBe(false);
    expect(getChecklistItemToggleEligibility(sorted, [99], 77, true).canMarkChecked).toBe(true);

    expect(mergeTaskChecklistCheckedIds(items, [77], new Set())).not.toContain(77);
    expect(mergeTaskChecklistCheckedIds(items, [99, 77], new Set())).toContain(77);
  });
});

describe("applyTaskChecklistMerge", () => {
  const searchParallelItems: TaskChecklistItem[] = [
    item({
      id: 1,
      order: 0,
      label: "Pre-approval",
      explanation: "",
    }),
    item({
      id: 5,
      order: 1,
      label: "Budget",
      explanation: "",
      allow_unordered_check: true,
      selectable_when: { kind: "all_items_checked", item_ids: [1] },
    }),
    item({
      id: 4,
      order: 2,
      label: "Areas",
      explanation: "",
      allow_unordered_check: true,
      selectable_when: { kind: "all_items_checked", item_ids: [1] },
    }),
    item({
      id: 2,
      order: 3,
      label: "Criteria",
      explanation: "",
      allow_unordered_check: true,
      selectable_when: { kind: "all_items_checked", item_ids: [1] },
    }),
    item({ id: 3, order: 4, label: "Agent", explanation: "" }),
  ];

  it("matches Python test_merge_search_parallel_integrations_after_preapproval", () => {
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [5], new Set())).toEqual([]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 5], new Set())).toEqual([1, 5]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 4], new Set())).toEqual([1, 4]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 2, 4, 5], new Set())).toEqual([
      1, 2, 4, 5,
    ]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 2, 4, 5, 3], new Set())).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("reports selectable_when when budget requested without pre-approval", () => {
    const items: TaskChecklistItem[] = [
      item({ id: 1, order: 0, label: "Pre-approval", explanation: "" }),
      item({
        id: 5,
        order: 1,
        label: "Budget",
        explanation: "",
        allow_unordered_check: true,
        selectable_when: { kind: "all_items_checked", item_ids: [1] },
      }),
    ];
    const r = applyTaskChecklistMerge(items, [5], new Set());
    expect(r.effectiveIds).toEqual([]);
    expect(r.strippedRequestedIds).toEqual([5]);
    expect(r.strippedReasonCodes).toEqual([MERGE_REASON_SELECTABLE_WHEN]);
  });

  it("reports signature_based for requested signature id", () => {
    const items: TaskChecklistItem[] = [
      item({ id: 1, order: 0, label: "A", explanation: "", allow_unordered_check: true }),
      item({
        id: 6,
        order: 1,
        label: "Sign",
        explanation: "",
        allow_unordered_check: true,
        completionType: "signature_based",
      }),
    ];
    const r = applyTaskChecklistMerge(items, [1, 6], new Set());
    expect(r.effectiveIds).toEqual([1]);
    expect(r.strippedRequestedIds).toEqual([6]);
    expect(r.strippedReasonCodes).toEqual([MERGE_REASON_SIGNATURE_BASED]);
  });
});
