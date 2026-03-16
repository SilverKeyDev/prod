// Centralized checklist names for guided checklist flow

export {
  type ChecklistComponentKey,
  type ChecklistIntegrationComponentProps,
  isChecklistComponentKey,
} from "./componentRegistry";

export type ChecklistTab = "search" | "offer" | "escrow" | "inspections" | "financing" | "closing";

export const CHECKLIST_TITLES: Record<ChecklistTab, string> = {
  search: "Search",
  offer: "Offer",
  escrow: "Escrow",
  inspections: "Inspections",
  financing: "Loan",
  closing: "Move In",
};

export const CHECKLIST_SUBTITLES: Record<ChecklistTab, string> = {
  search: "Find your next home with a structured approach",
  offer: "Prepare and submit a competitive offer",
  escrow: "Stay on top of the escrow and legal process",
  inspections: "Follow these steps to make an informed decision before closing",
  financing: "Stay on top of your loan and insurance tasks",
  closing: "Track your progress toward a smooth move into your new home",
};
