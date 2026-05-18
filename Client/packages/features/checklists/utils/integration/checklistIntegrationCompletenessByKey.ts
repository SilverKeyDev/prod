import type { AgentConversation } from "packages/api";
import type { ChecklistComponentKey } from "packages/features/checklists/types/componentRegistry";
import type { OnboardingData } from "packages/features/profile/types/onboarding";

import {
  isChooseSearchAreaStepComplete,
  isDefineCriteriaStepComplete,
  isPartnerWithAgentStepComplete,
  isSetBudgetStepComplete,
} from "./checklistIntegrationCompleteness";

/** Preference-backed integration keys that support auto-complete from saved profile data. */
const PREFERENCE_BACKED_KEYS: ChecklistComponentKey[] = [
  "set_budget",
  "choose_areas",
  "define_criteria",
];

export function isPreferenceBackedChecklistIntegrationKey(
  key: string | undefined
): key is ChecklistComponentKey {
  return key != null && (PREFERENCE_BACKED_KEYS as string[]).includes(key);
}

/**
 * Whether saved preferences / messaging state satisfies an integration step's requirements.
 */
export function isChecklistIntegrationStepComplete(
  componentKey: ChecklistComponentKey,
  formData: Partial<OnboardingData> | null,
  conversations: readonly AgentConversation[]
): boolean {
  switch (componentKey) {
    case "set_budget":
      return formData != null && isSetBudgetStepComplete(formData);
    case "choose_areas":
      return formData != null && isChooseSearchAreaStepComplete(formData);
    case "define_criteria":
      return formData != null && isDefineCriteriaStepComplete(formData);
    case "partner_agent":
      return isPartnerWithAgentStepComplete([...conversations]);
    default:
      return false;
  }
}
