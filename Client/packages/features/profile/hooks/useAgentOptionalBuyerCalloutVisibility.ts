import { useProfileUiSurface } from "packages/features/profile/hooks/usePersonalizationSectionLayout";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { shouldShowAgentOptionalBuyerCallout } from "packages/features/profile/types/visibility/profileVisibility";
import { primaryOnboardingRoleFromForm } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { useIsAgent } from "packages/hooks/store/useIsAgent";

/** True only on onboarding when the user (or draft) is an agent. */
export function useAgentOptionalBuyerCalloutVisibility(
  formData?: Pick<OnboardingData, "primary_onboarding_role" | "why_joining_silverkey">
): boolean {
  const surface = useProfileUiSurface();
  const authIsAgent = useIsAgent();
  return shouldShowAgentOptionalBuyerCallout({
    surface,
    authIsAgent,
    formPrimaryRole: formData ? primaryOnboardingRoleFromForm(formData) : undefined,
  });
}
