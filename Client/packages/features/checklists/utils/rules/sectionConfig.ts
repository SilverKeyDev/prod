import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import type { SectionConfig } from "packages/features/checklists/types/sectionConfig";
import { CHECKLIST_SECTION_ORDER } from "packages/utils/checklists/sectionOrder";

export type { SectionConfig } from "packages/features/checklists/types/sectionConfig";

export const SECTION_ORDER: ChecklistTab[] = [...CHECKLIST_SECTION_ORDER];

export const SECTION_CONFIG: Record<ChecklistTab, SectionConfig> = {
  search: { id: "search", order: 0, unlockRequiresSections: [] },
  offer: { id: "offer", order: 1, unlockRequiresSections: ["search"] },
  escrow: { id: "escrow", order: 2, unlockRequiresSections: ["search", "offer"] },
  inspections: {
    id: "inspections",
    order: 3,
    unlockRequiresSections: ["search", "offer", "escrow"],
  },
  financing: {
    id: "financing",
    order: 4,
    unlockRequiresSections: ["search", "offer", "escrow", "inspections"],
  },
  closing: {
    id: "closing",
    order: 5,
    unlockRequiresSections: ["search", "offer", "escrow", "inspections", "financing"],
  },
};

/** First phase in `unlockRequiresSections` that is not complete; `null` if this section should be unlocked. */
export function getFirstIncompleteUnlockSection(
  section: ChecklistTab,
  sectionProgress: Record<ChecklistTab, { isComplete: boolean }>
): ChecklistTab | null {
  for (const req of SECTION_CONFIG[section].unlockRequiresSections) {
    if (!sectionProgress[req]?.isComplete) return req;
  }
  return null;
}
