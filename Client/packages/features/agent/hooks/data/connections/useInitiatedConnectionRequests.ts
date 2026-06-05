import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

export const initiatedConnectionRequestsQueryKey = [
  ...queryKeys.agent.all,
  "connection-requests",
  "initiated",
] as const;

export function useInitiatedConnectionRequests(enabled: boolean = true): {
  requests: AgentConnectionRequest[];
  isLoading: boolean;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const { data, isLoading } = useQuery({
    queryKey: initiatedConnectionRequestsQueryKey,
    queryFn: async () => {
      const response = await agentApi.getConnectionRequests("initiated");
      if (!response.success) {
        throw new Error(
          resolveApiResultErrorMessage(response, "Failed to fetch connection requests")
        );
      }
      return response.requests ?? [];
    },
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 30 * 1000,
  });

  return {
    requests: data ?? [],
    isLoading,
  };
}
