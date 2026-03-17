import type { ChecklistTab } from "packages/features/checklists/types/checklists";

export const SECTION_ORDER: ChecklistTab[] = [
  "search",
  "offer",
  "escrow",
  "inspections",
  "financing",
  "closing",
];

export type SectionConfig = {
  id: ChecklistTab;
  order: number;
  unlockRequiresSections: ChecklistTab[];
  componentKeys?: string[];
};

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
