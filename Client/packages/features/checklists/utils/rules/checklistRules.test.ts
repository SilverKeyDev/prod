import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import {
  evaluateChecklistCondition,
  getChecklistItemToggleEligibility,
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

  it("allows uncheck when lock condition does not hold", () => {
    const e = getChecklistItemToggleEligibility(items, [2], 2, true);
    expect(e.canUncheck).toBe(true);
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
});
