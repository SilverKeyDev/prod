// Centralized checklist names for Close feature

export type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";

// Deprecated: Replaced by CHECKLIST_TITLES everywhere

export const CHECKLIST_TITLES: Record<ChecklistTab, string> = {
  escrow: "Escrow",
  inspections: "Inspections",
  financing: "Loan",
  closing: "Move In",
};

export const CHECKLIST_SUBTITLES: Record<ChecklistTab, string> = {
  escrow: "Stay on top of the escrow and legal process",
  inspections: "Follow these steps to make an informed decision before closing",
  financing: "Stay on top of your loan and insurance tasks",
  closing: "Track your progress toward a smooth transition into your new home",
};


