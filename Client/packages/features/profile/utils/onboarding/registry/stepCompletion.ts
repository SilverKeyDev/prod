import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import {
  isSelectableOnboardingRole,
  primaryOnboardingRoleFromForm,
} from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
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

const STEP_COMPLETION_HANDLERS: Partial<
  Record<ProfileStepId, (formData: OnboardingData) => boolean>
> = {
  demographics: () => true,
  onboarding_role: isOnboardingRoleStepComplete,
  housing_essentials: isHousingEssentialsStepComplete,
  housing_ranges: () => true,
  search_property: () => true,
  location: isLocationStepComplete,
  agent_brokerage: () => true,
  agent_licensing: () => true,
  agent_profile: () => true,
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
