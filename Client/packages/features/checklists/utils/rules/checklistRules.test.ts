import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

import {
  applyTaskChecklistMerge,
  evaluateChecklistCondition,
  getChecklistItemToggleEligibility,
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

  it("allows unchecking a previously checked id without lock_uncheck_when", () => {
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
    expect(merged).toEqual([1]);
  });

  it("strips manual check when selectable_when fails on submit-gated integration", () => {
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
        label: "Budget",
        explanation: "",
        allow_unordered_check: true,
        component_key: "set_budget",
        completionRequiresSubmit: true,
        selectable_when: {
          kind: "all_items_checked",
          item_ids: [1],
        },
      }),
    ];
    const merged = mergeTaskChecklistCheckedIds(items, [2], new Set());
    expect(merged).toEqual([]);
  });

  it("allows manual check when selectable_when fails on a non-gated step", () => {
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
    expect(merged).toEqual([2]);
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

  it("allows uncheck on a manually checked step without lock_uncheck_when", () => {
    const e = getChecklistItemToggleEligibility(items, [2], 2, true);
    expect(e.canUncheck).toBe(true);
    expect(e.canCheck).toBe(false);
  });

  it("blocks uncheck when the step was auto-completed", () => {
    const autoItems: TaskChecklistItem[] = [
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
    const e = getChecklistItemToggleEligibility(autoItems, [1, 2], 2, true);
    expect(e.canUncheck).toBe(false);
    expect(getChecklistItemToggleEligibility(autoItems, [1, 2], 1, true).canUncheck).toBe(true);
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

  it("allows marking complete in a later phase when sectionUnlocked is false", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 10,
        order: 0,
        label: "Offer step",
        explanation: "",
      }),
    ];
    const e = getChecklistItemToggleEligibility(items, [], 10, false);
    expect(e.canMarkChecked).toBe(true);
    expect(e.canCheck).toBe(true);
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
        label: "Budget",
        explanation: "",
        component_key: "set_budget",
        completionRequiresSubmit: true,
      }),
    ];
    const e = getChecklistItemToggleEligibility(withSubmit, [1], 2, true);
    expect(e.canMarkChecked).toBe(true);
    expect(e.canCheck).toBe(false);
  });

  it("submit-only active step: merge keeps id after client requests check (integration submit path)", () => {
    const withSubmit: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "Prior",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "Set budget",
        explanation: "",
        component_key: "set_budget",
        completionRequiresSubmit: true,
        allow_unordered_check: true,
      }),
    ];
    const eligibility = getChecklistItemToggleEligibility(withSubmit, [1], 2, true);
    expect(eligibility.canMarkChecked).toBe(true);

    const merged = mergeTaskChecklistCheckedIds(withSubmit, [1, 2], new Set([1]));
    expect(merged).toContain(2);
  });

  it("allows completing a later step before an earlier one in template order", () => {
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

    expect(getChecklistItemToggleEligibility(sorted, [], 77, true).canMarkChecked).toBe(true);
    expect(mergeTaskChecklistCheckedIds(items, [77], new Set())).toContain(77);
    expect(mergeTaskChecklistCheckedIds(items, [99, 77], new Set())).toEqual([77, 99]);
  });
});

describe("applyTaskChecklistMerge", () => {
  const searchParallelItems: TaskChecklistItem[] = [
    item({
      id: 5,
      order: 0,
      label: "Budget",
      explanation: "",
      allow_unordered_check: true,
    }),
    item({
      id: 4,
      order: 1,
      label: "Areas",
      explanation: "",
      allow_unordered_check: true,
    }),
    item({
      id: 2,
      order: 2,
      label: "Criteria",
      explanation: "",
      allow_unordered_check: true,
    }),
    item({ id: 1, order: 3, label: "Pre-approval", explanation: "" }),
    item({ id: 3, order: 4, label: "Agent", explanation: "" }),
  ];

  it("matches Python test_merge_search_parallel_integrations_without_preapproval_gate", () => {
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [5], new Set())).toEqual([5]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [4], new Set())).toEqual([4]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [2], new Set())).toEqual([2]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [2, 4, 5], new Set())).toEqual([
      2, 4, 5,
    ]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 2, 4, 5], new Set())).toEqual([
      1, 2, 4, 5,
    ]);
    expect(mergeTaskChecklistCheckedIds(searchParallelItems, [1, 2, 4, 5, 3], new Set())).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("search parallel integrations are markable without pre-approval checked", () => {
    expect(getChecklistItemToggleEligibility(searchParallelItems, [], 5, true).canMarkChecked).toBe(
      true
    );
    expect(getChecklistItemToggleEligibility(searchParallelItems, [], 4, true).canMarkChecked).toBe(
      true
    );
    expect(getChecklistItemToggleEligibility(searchParallelItems, [], 2, true).canMarkChecked).toBe(
      true
    );
  });

  it("allows budget without pre-approval when no selectable_when gate", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 5,
        order: 0,
        label: "Budget",
        explanation: "",
        allow_unordered_check: true,
      }),
      item({ id: 1, order: 3, label: "Pre-approval", explanation: "" }),
    ];
    const r = applyTaskChecklistMerge(items, [5], new Set());
    expect(r.effectiveIds).toEqual([5]);
    expect(r.strippedRequestedIds).toEqual([]);
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
