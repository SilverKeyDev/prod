import type { ProfileStep } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import { SECTION_TITLES } from "packages/utils/domain/profile/labels";

const STEP_TITLES: Record<ProfileStepId, string> = {
  onboarding_role: SECTION_TITLES.ONBOARDING_ROLE,
  demographics: "About",
  housing_essentials: "Essentials",
  housing_ranges: "Size",
  location: "Location",
  search_property: "Features",
  financial: "Finance",
  agent_brokerage: "Brokerage",
  agent_licensing: "Licensing",
  agent_profile: "Territory",
  availability: SECTION_TITLES.AVAILABILITY,
  privacy_data: "Privacy & data",
};

export function profileStepFromId(id: ProfileStepId): ProfileStep {
  return { id, title: STEP_TITLES[id] };
}

export function profileStepsFromIds(ids: readonly ProfileStepId[]): ProfileStep[] {
  return ids.map(profileStepFromId);
}
