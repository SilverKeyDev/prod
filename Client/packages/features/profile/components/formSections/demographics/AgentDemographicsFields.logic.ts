import type { OnboardingData } from "packages/features/profile/utils";
import {
  effectiveIsAgentForOptionalBuyerUi,
  primaryOnboardingRoleFromForm,
} from "packages/features/profile/utils";
import { useIsAgent } from "packages/hooks/store/useIsAgent";

export function useAgentDemographicsContext(formData: OnboardingData) {
  const authIsAgent = useIsAgent();
  const showBuyerFacingDemographics = !effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formPrimaryRole: primaryOnboardingRoleFromForm(formData),
  });

  return { authIsAgent, showBuyerFacingDemographics };
}

export function createToggleLookingForAgentHandler(
  formData: OnboardingData,
  updateFormData: (field: keyof OnboardingData, value: unknown) => void
) {
  return () => {
    updateFormData("looking_for_buyers_agent", !formData.looking_for_buyers_agent);
  };
}
