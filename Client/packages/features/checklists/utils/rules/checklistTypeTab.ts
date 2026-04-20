import type { ChecklistType } from "packages/features/checklists/api/checklists";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";

const VALID_CHECKLIST_TYPES: ChecklistType[] = [
  "search",
  "offer",
  "escrow",
  "financing",
  "closing",
  "insurance",
];

export function parseChecklistTypeFromApiEndpoint(apiEndpoint: string): ChecklistType {
  const match = apiEndpoint.match(/type=(\w+)/);
  if (match?.[1]) {
    const type = match[1] as ChecklistType;
    if (VALID_CHECKLIST_TYPES.includes(type)) {
      return type;
    }
  }
  return "escrow";
}

/** Maps API checklist `type` query value to buyer-roadmap `ChecklistTab`. */
export const CHECKLIST_TYPE_TO_TAB: Record<ChecklistType, ChecklistTab> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  insurance: "inspections",
  financing: "financing",
  closing: "closing",
};
