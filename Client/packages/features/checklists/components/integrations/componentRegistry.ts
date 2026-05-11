import React from "react";

import type {
  ChecklistComponentKey,
  ChecklistIntegrationComponentProps,
} from "packages/features/checklists/types/componentRegistry";
import { isChecklistComponentKey } from "packages/features/checklists/types/componentRegistry";

import ChooseAreasSection from "./areas/ChooseAreasSection";
import SetBudgetSection from "./budget/SetBudgetSection";
import ReviewComparablesSection from "./comparables/ReviewComparablesSection";
import HomeConcierge from "./concierge/HomeConcierge";
import DefineCriteriaSection from "./criteria/DefineCriteriaSection";
import FindingHome from "./findingHome/FindingHome";
import PartnerAgentSection from "./partnerAgent/PartnerAgentSection";

export const COMPONENT_REGISTRY: Record<
  ChecklistComponentKey,
  React.ComponentType<ChecklistIntegrationComponentProps>
> = {
  choose_areas: ChooseAreasSection,
  define_criteria: DefineCriteriaSection,
  finding_home: FindingHome,
  home_concierge: HomeConcierge,
  partner_agent: PartnerAgentSection,
  review_comparables: ReviewComparablesSection,
  set_budget: SetBudgetSection,
};

export function getChecklistComponent(
  key: string | undefined
): React.ComponentType<ChecklistIntegrationComponentProps> | null {
  return key && isChecklistComponentKey(key) ? COMPONENT_REGISTRY[key] : null;
}
