import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import {
  applyTaskChecklistMerge,
  evaluateChecklistCondition,
  getChecklistItemToggleEligibility,
  MERGE_REASON_SIGNATURE_BASED,
  mergeTaskChecklistCheckedIds,
} from "./checklistRules";
import { checklistRulesTestItem as item } from "./checklistRules.testHelpers";

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

describe("mergeTaskChecklistCheckedIds bypassProgressGates", () => {
  it("allows agent to check signature-based step", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 6,
        order: 0,
        label: "Sign",
        explanation: "",
        allow_unordered_check: true,
        completionType: "signature_based",
      }),
    ];
    expect(mergeTaskChecklistCheckedIds(items, [6], new Set())).toEqual([]);
    expect(
      mergeTaskChecklistCheckedIds(items, [6], new Set(), { bypassProgressGates: true })
    ).toEqual([6]);
  });

  it("allows agent to check submit-gated step without selectable_when", () => {
    const items: TaskChecklistItem[] = [
      item({
        id: 2,
        order: 1,
        label: "Set budget",
        explanation: "",
        component_key: "set_budget",
        completionRequiresSubmit: true,
        selectable_when: { kind: "all_items_checked", item_ids: [1] },
      }),
    ];
    expect(
      mergeTaskChecklistCheckedIds(items, [2], new Set(), { bypassProgressGates: true })
    ).toEqual([2]);
    expect(mergeTaskChecklistCheckedIds(items, [2], new Set())).toEqual([]);
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
    item({
      id: 3,
      order: 4,
      label: "Agent",
      explanation: "",
      allow_unordered_check: true,
      parallel_step_group: "search_parallel_integrations",
    }),
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
    expect(getChecklistItemToggleEligibility(searchParallelItems, [], 3, true).canMarkChecked).toBe(
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
