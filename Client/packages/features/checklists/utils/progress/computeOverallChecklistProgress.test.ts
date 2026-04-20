import { describe, expect, it } from "vitest";

import type { ChecklistTab } from "packages/features/checklists/types/checklists";

import { computeOverallChecklistProgress } from "./computeOverallChecklistProgress";

function emptySectionProgress(): Record<ChecklistTab, { completed: number; total: number }> {
  return {
    search: { completed: 0, total: 0 },
    offer: { completed: 0, total: 0 },
    escrow: { completed: 0, total: 0 },
    inspections: { completed: 0, total: 0 },
    financing: { completed: 0, total: 0 },
    closing: { completed: 0, total: 0 },
  };
}

describe("computeOverallChecklistProgress", () => {
  it("returns zeros when all sections are empty", () => {
    expect(computeOverallChecklistProgress(emptySectionProgress())).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });

  it("sums completed and total across SECTION_ORDER", () => {
    const sectionProgress = emptySectionProgress();
    sectionProgress.search = { completed: 2, total: 5 };
    sectionProgress.offer = { completed: 1, total: 3 };
    sectionProgress.escrow = { completed: 0, total: 4 };
    expect(computeOverallChecklistProgress(sectionProgress)).toEqual({
      completed: 3,
      total: 12,
      percent: 25,
    });
  });

  it("rounds percent to nearest integer", () => {
    const sectionProgress = emptySectionProgress();
    sectionProgress.search = { completed: 1, total: 3 };
    expect(computeOverallChecklistProgress(sectionProgress).percent).toBe(33);
  });

  it("aggregates all six tabs", () => {
    const sectionProgress = emptySectionProgress();
    sectionProgress.search = { completed: 1, total: 1 };
    sectionProgress.offer = { completed: 1, total: 1 };
    sectionProgress.escrow = { completed: 1, total: 1 };
    sectionProgress.inspections = { completed: 1, total: 1 };
    sectionProgress.financing = { completed: 1, total: 1 };
    sectionProgress.closing = { completed: 0, total: 1 };
    expect(computeOverallChecklistProgress(sectionProgress)).toEqual({
      completed: 5,
      total: 6,
      percent: 83,
    });
  });
});
