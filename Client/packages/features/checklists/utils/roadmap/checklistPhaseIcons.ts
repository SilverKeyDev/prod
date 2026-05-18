import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import type { IconName } from "packages/ui/types/icons";

/** Phase tab icons — keep in sync with ClosePageHeader TAB_CONFIG. */
export const CHECKLIST_PHASE_ICON_NAMES: Record<ChecklistTab, IconName> = {
  search: "search",
  offer: "file-signature",
  escrow: "file-text",
  inspections: "clipboard-check",
  financing: "dollar-sign",
  closing: "home",
};

const CHECKLIST_TABS = new Set<string>(Object.keys(CHECKLIST_PHASE_ICON_NAMES));

export function isChecklistTabId(phaseId: string): phaseId is ChecklistTab {
  return CHECKLIST_TABS.has(phaseId);
}

export function getChecklistPhaseIconName(phaseId: string): IconName | null {
  if (!isChecklistTabId(phaseId)) return null;
  return CHECKLIST_PHASE_ICON_NAMES[phaseId];
}
