import { useProfileUiSurface } from "packages/features/profile/components/layout";
import { shouldShowAgentOptionalBuyerCallout } from "packages/features/profile/types/profileVisibility";
import { useIsAgent } from "packages/hooks/store/useIsAgent";

/** True only on onboarding when the user (or draft) is an agent. */
export function useAgentOptionalBuyerCalloutVisibility(formIsAgent?: string): boolean {
  const surface = useProfileUiSurface();
  const authIsAgent = useIsAgent();
  return shouldShowAgentOptionalBuyerCallout({
    surface,
    authIsAgent,
    formIsAgent,
  });
}
