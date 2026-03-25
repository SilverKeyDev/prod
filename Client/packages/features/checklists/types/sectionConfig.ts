import type { ChecklistTab } from "./checklists";

export type SectionConfig = {
  id: ChecklistTab;
  order: number;
  unlockRequiresSections: ChecklistTab[];
  componentKeys?: string[];
};
