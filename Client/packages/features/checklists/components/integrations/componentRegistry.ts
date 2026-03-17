import React from "react";

import type {
  ChecklistComponentKey,
  ChecklistIntegrationComponentProps,
} from "packages/features/checklists/types/componentRegistry";
import { isChecklistComponentKey } from "packages/features/checklists/types/componentRegistry";

import ChooseAreasSection from "./ChooseAreasSection";
import DefineCriteriaSection from "./DefineCriteriaSection";
import FindingHome from "./FindingHome";
import HomeConcierge from "./HomeConcierge";
import ReviewComparablesSection from "./ReviewComparablesSection";
import SetBudgetSection from "./SetBudgetSection";

export const COMPONENT_REGISTRY: Record<
  ChecklistComponentKey,
  React.ComponentType<ChecklistIntegrationComponentProps>
> = {
  choose_areas: ChooseAreasSection,
  define_criteria: DefineCriteriaSection,
  finding_home: FindingHome,
  home_concierge: HomeConcierge,
  review_comparables: ReviewComparablesSection,
  set_budget: SetBudgetSection,
};

export function getChecklistComponent(
  key: string | undefined
): React.ComponentType<ChecklistIntegrationComponentProps> | null {
  return key && isChecklistComponentKey(key) ? COMPONENT_REGISTRY[key] : null;
}
