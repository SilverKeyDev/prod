import React from "react";

import type {
  ChecklistComponentKey,
  ChecklistIntegrationComponentProps,
} from "packages/features/checklists/types/componentRegistry";
import { isChecklistComponentKey } from "packages/features/checklists/types/componentRegistry";
import PartnerTransactionIntegration from "packages/features/partners/components/PartnerTransactionIntegration";

import ChooseAreasSection from "./areas/ChooseAreasSection";
import SetBudgetSection from "./budget/SetBudgetSection";
import BuyerBrokerReviewSection from "./buyerBrokerReview/BuyerBrokerReviewSection";
import ReviewComparablesSection from "./comparables/ReviewComparablesSection";
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
  partner_placements: PartnerTransactionIntegration,
  partner_agent: PartnerAgentSection,
  buyer_broker_review: BuyerBrokerReviewSection,
  review_comparables: ReviewComparablesSection,
  set_budget: SetBudgetSection,
};

export function getChecklistComponent(
  key: string | undefined
): React.ComponentType<ChecklistIntegrationComponentProps> | null {
  return key && isChecklistComponentKey(key) ? COMPONENT_REGISTRY[key] : null;
}
