import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { SECTION_ORDER } from "packages/features/checklists/utils/rules/sectionConfig";

export type SectionProgressSlice = {
  completed: number;
  total: number;
};

export type OverallChecklistProgress = {
  completed: number;
  total: number;
  percent: number;
};

/**
 * Sums checklist completion across all journey sections in display order.
 */
export function computeOverallChecklistProgress(
  sectionProgress: Record<ChecklistTab, SectionProgressSlice>
): OverallChecklistProgress {
  let completed = 0;
  let total = 0;
  for (const tab of SECTION_ORDER) {
    const slice = sectionProgress[tab];
    completed += slice.completed;
    total += slice.total;
  }
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}
