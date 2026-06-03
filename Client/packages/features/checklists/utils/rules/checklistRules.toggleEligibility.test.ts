import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

import { getChecklistItemToggleEligibility, mergeTaskChecklistCheckedIds } from "./checklistRules";
import { checklistRulesTestItem as item } from "./checklistRules.testHelpers";

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

  it("agent viewer may manually check and uncheck submit-gated steps", () => {
    const withSubmit: TaskChecklistItem[] = [
      item({
        id: 2,
        order: 1,
        label: "Set budget",
        explanation: "",
        component_key: "set_budget",
        completionRequiresSubmit: true,
      }),
    ];
    const unchecked = getChecklistItemToggleEligibility(withSubmit, [], 2, true, {
      isAgentViewer: true,
    });
    expect(unchecked.canCheck).toBe(true);
    expect(unchecked.canUncheck).toBe(false);
    expect(unchecked.canMarkChecked).toBe(true);

    const checked = getChecklistItemToggleEligibility(withSubmit, [2], 2, true, {
      isAgentViewer: true,
    });
    expect(checked.canCheck).toBe(false);
    expect(checked.canUncheck).toBe(true);
    expect(checked.canMarkChecked).toBe(true);
  });

  it("agent viewer may manually toggle signature-based steps", () => {
    const sig: TaskChecklistItem[] = [
      item({
        id: 6,
        order: 0,
        label: "Sign agreement",
        explanation: "",
        completionType: "signature_based",
      }),
    ];
    const unchecked = getChecklistItemToggleEligibility(sig, [], 6, true, { isAgentViewer: true });
    expect(unchecked.canCheck).toBe(true);
    expect(unchecked.canUncheck).toBe(false);
    expect(unchecked.canMarkChecked).toBe(true);
  });

  it("submit-gated steps cannot be manually unchecked when checked", () => {
    const withSubmit: TaskChecklistItem[] = [
      item({
        id: 1,
        order: 0,
        label: "Partner with agent",
        explanation: "",
        component_key: "partner_agent",
        completionRequiresSubmit: true,
      }),
      item({
        id: 2,
        order: 1,
        label: "Decide on a home",
        explanation: "",
        component_key: "finding_home",
        completionRequiresSubmit: true,
      }),
    ];
    const partner = getChecklistItemToggleEligibility(withSubmit, [1], 1, true);
    expect(partner.canCheck).toBe(false);
    expect(partner.canUncheck).toBe(false);

    const finding = getChecklistItemToggleEligibility(withSubmit, [2], 2, true);
    expect(finding.canCheck).toBe(false);
    expect(finding.canUncheck).toBe(false);
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
