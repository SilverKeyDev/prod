import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import type { ChecklistStepOption } from "packages/features/partners/api/partners";
import { CHECKLIST_SECTION_ORDER } from "packages/utils/product/checklists/sectionOrder";
import type { Workspace } from "packages/utils/product/workspace";

export const CHECKLIST_TARGET_ROLES: Workspace[] = ["buyer", "seller"];

export function resolveChecklistRoles(targetRoles: string[] | undefined): Workspace[] {
  return CHECKLIST_TARGET_ROLES.filter((role) => targetRoles?.includes(role));
}

export function sectionsForChecklistRole(role: Workspace): ChecklistTab[] {
  if (role === "buyer") {
    return [...CHECKLIST_SECTION_ORDER];
  }
  return [];
}

export function stepsForSection(
  steps: ChecklistStepOption[],
  section: ChecklistTab
): ChecklistStepOption[] {
  return steps.filter((s) => s.section === section);
}

export function stepLabel(steps: ChecklistStepOption[], stepId: string): string {
  const match = steps.find((s) => s.step_id === stepId);
  return match ? `${match.label} (${stepId})` : stepId;
}
