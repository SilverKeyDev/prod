import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { isAgentFormSelection } from "packages/features/profile/utils/onboarding/role/agentFormSelection";
import { primaryOnboardingRoleFromForm } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";

import { nonEmptyStr, preferenceExtensionSectionHasAny, tagArrayAny } from "./shared";

export function agentBrokeragePair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (nonEmptyStr(formData.agent_brokerage_name) ||
      nonEmptyStr(formData.agent_brokerage_bic_name) ||
      nonEmptyStr(formData.agent_brokerage_address) ||
      nonEmptyStr(formData.agent_brokerage_email) ||
      nonEmptyStr(formData.agent_brokerage_phone) ||
      nonEmptyStr(formData.agent_physical_mailing_address));
  return { any: hasAny, complete: isAgent && nonEmptyStr(formData.agent_brokerage_name) };
}

export function agentLicensingPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (tagArrayAny(formData.agent_licensed_states) ||
      tagArrayAny(formData.agent_license_numbers) ||
      tagArrayAny(formData.agent_license_types) ||
      tagArrayAny(formData.agent_license_expiration_dates));
  return { any: hasAny, complete: isAgent && tagArrayAny(formData.agent_license_numbers) };
}

export function agentProfilePair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (nonEmptyStr(formData.agent_bio) ||
      tagArrayAny(formData.agent_primary_service_zips) ||
      tagArrayAny(formData.agent_specialties));
  return { any: hasAny, complete: hasAny };
}

export function availabilityPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  if (!isAgent) {
    return { any: false, complete: true };
  }
  const extRec = formData.buyerPreferenceExtensions as Record<string, unknown> | undefined;
  const hasAny = preferenceExtensionSectionHasAny(extRec?.availability);
  return { any: hasAny, complete: hasAny };
}
