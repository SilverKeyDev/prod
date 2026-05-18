import { useMemo } from "react";

import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useSearchContextStore } from "packages/store";

import {
  type AgentDiscoveryRecommendationInput,
  buildAgentDiscoveryRecommendationInput,
} from "@/features/agent/utils/agentDiscovery/buildAgentDiscoveryRecommendationInput";

/**
 * Derives recommendation API params from saved preferences and current search UI context.
 */
export function useAgentDiscoveryContext(): AgentDiscoveryRecommendationInput {
  const { userPreferences } = useUserPreferences();
  const locationPlaceLabel = useSearchContextStore((s) => s.locationPlaceLabel);
  const searchFilterOverrides = useSearchContextStore((s) => s.searchFilterOverrides);

  return useMemo(
    () =>
      buildAgentDiscoveryRecommendationInput({
        preferences: userPreferences,
        locationPlaceLabel,
        searchFilterOverrides,
      }),
    [userPreferences, locationPlaceLabel, searchFilterOverrides]
  );
}
