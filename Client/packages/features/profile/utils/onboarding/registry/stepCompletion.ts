import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import {
  isSelectableOnboardingRole,
  primaryOnboardingRoleFromForm,
} from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import {
  isBuyerAboutMeStepComplete,
  isBuyerFinancingStepComplete,
  shouldUseBuyerOnboardingValidators,
} from "packages/features/profile/utils/onboarding/validation/buyerStepValidation";
import { parseHousingTypes } from "packages/features/profile/utils/public/constants";

const HOUSING_ESSENTIALS_REQUIRED_FIELDS: (keyof OnboardingData)[] = [
  "preferred_bedrooms_min",
  "preferred_bathrooms_min",
  "preferred_housing_type",
];

function isOnboardingRoleStepComplete(formData: OnboardingData): boolean {
  const role = primaryOnboardingRoleFromForm(formData);
  return role !== undefined && isSelectableOnboardingRole(role);
}

function isHousingEssentialsStepComplete(formData: OnboardingData): boolean {
  for (const key of HOUSING_ESSENTIALS_REQUIRED_FIELDS) {
    const value = formData[key];
    if (key === "preferred_housing_type") {
      const parsed = parseHousingTypes(value as string | undefined);
      if (parsed.length === 0) return false;
      continue;
    }
    if (value === undefined || value === null) return false;
    if (typeof value === "number") continue;
    if (typeof value === "string" && value.trim() === "") return false;
  }
  return true;
}

function isLocationStepComplete(formData: OnboardingData): boolean {
  const locations = formData.important_locations;
  if (!locations || locations.length === 0) return false;
  return locations.every((loc) => loc?.address?.trim() !== "");
}

function isShellSetupStepComplete(formData: OnboardingData): boolean {
  const value = formData.workspace_shell_test_input;
  return typeof value === "string" && value.trim() !== "";
}

function isRenterBudgetStepComplete(formData: OnboardingData): boolean {
  return formData.renter_budget_max != null && formData.renter_budget_max > 0;
}

function isRenterLocationStepComplete(formData: OnboardingData): boolean {
  return Array.isArray(formData.important_locations) && formData.important_locations.length > 0;
}

function isRenterMoveTimelineStepComplete(formData: OnboardingData): boolean {
  return (
    typeof formData.renter_move_in_timeline === "string" &&
    formData.renter_move_in_timeline.trim() !== ""
  );
}

function isIpOrgDetailsComplete(formData: OnboardingData): boolean {
  return typeof formData.ip_org_name === "string" && formData.ip_org_name.trim() !== "";
}

function isIpIntegrationTypeComplete(formData: OnboardingData): boolean {
  return (
    typeof formData.ip_integration_type === "string" && formData.ip_integration_type.trim() !== ""
  );
}

function isIpPointOfContactComplete(formData: OnboardingData): boolean {
  return (
    typeof formData.ip_contact_name === "string" &&
    formData.ip_contact_name.trim() !== "" &&
    typeof formData.ip_contact_email === "string" &&
    formData.ip_contact_email.trim() !== ""
  );
}

function isIpServiceAreaComplete(formData: OnboardingData): boolean {
  return Array.isArray(formData.ip_service_states) && formData.ip_service_states.length > 0;
}

function isIpAgreementComplete(formData: OnboardingData): boolean {
  return formData.ip_agreement_acknowledged === true;
}

const STEP_COMPLETION_HANDLERS: Partial<
  Record<ProfileStepId, (formData: OnboardingData) => boolean>
> = {
  demographics: (formData) =>
    shouldUseBuyerOnboardingValidators(formData) ? isBuyerAboutMeStepComplete(formData) : true,
  financial: (formData) =>
    shouldUseBuyerOnboardingValidators(formData) ? isBuyerFinancingStepComplete(formData) : true,
  onboarding_role: isOnboardingRoleStepComplete,
  housing_essentials: isHousingEssentialsStepComplete,
  housing_ranges: () => true,
  search_property: () => true,
  location: isLocationStepComplete,
  agent_brokerage: () => true,
  agent_licensing: () => true,
  agent_profile: () => true,
  seller_shell_setup: isShellSetupStepComplete,
  renter_shell_setup: isShellSetupStepComplete,
  brokerage_shell_setup: isShellSetupStepComplete,
  integration_partner_shell_setup: isShellSetupStepComplete,
  renter_budget: isRenterBudgetStepComplete,
  renter_location: isRenterLocationStepComplete,
  renter_move_timeline: isRenterMoveTimelineStepComplete,
  renter_household: () => true,
  renter_amenities: () => true,
  ip_org_details: isIpOrgDetailsComplete,
  ip_integration_type: isIpIntegrationTypeComplete,
  ip_point_of_contact: isIpPointOfContactComplete,
  ip_service_area: isIpServiceAreaComplete,
  ip_agreement: isIpAgreementComplete,
};

export function getStepCompletionHandler(
  stepId: string
): ((formData: OnboardingData) => boolean) | undefined {
  return STEP_COMPLETION_HANDLERS[stepId as ProfileStepId];
}

export function isStepCompleteForOnboarding(formData: OnboardingData, stepId: string): boolean {
  const handler = getStepCompletionHandler(stepId);
  return handler ? handler(formData) : true;
}
