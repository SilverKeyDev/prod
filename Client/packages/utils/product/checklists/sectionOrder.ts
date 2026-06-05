/** Buyer checklist section ids in display order. */
export const CHECKLIST_SECTION_ORDER = [
  "search",
  "offer",
  "escrow",
  "inspections",
  "financing",
  "closing",
] as const;

export type ChecklistSectionId = (typeof CHECKLIST_SECTION_ORDER)[number];
