import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";

import { agentApi } from "@/features/agent/api/agent";
import type { AgentDiscoveryRecommendationInput } from "@/features/agent/utils/agentDiscovery/buildAgentDiscoveryRecommendationInput";
import { serializeAgentDiscoveryRecommendationInput } from "@/features/agent/utils/agentDiscovery/buildAgentDiscoveryRecommendationInput";

const DEFAULT_LIMIT = 20;

export function useRecommendedAgents(
  context: AgentDiscoveryRecommendationInput,
  enabled: boolean = true
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const serialized = serializeAgentDiscoveryRecommendationInput(context);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.agent.recommendedAgents(serialized),
    queryFn: async () => {
      const response = await agentApi.recommendedAgents({
        ...context,
        limit: DEFAULT_LIMIT,
      });
      if (!response.success) {
        throw new Error("Failed to load recommended agents");
      }
      return response.agents ?? [];
    },
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 60 * 1000,
  });

  return {
    recommendedAgents: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
