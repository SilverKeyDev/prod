import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { agentApi } from "../../config/api/agent";
import { queryKeys } from "../../config/query/keys";
import { useAuthStore } from "../../store/auth.slice";
import type { AgentClient } from "../../config/api/agent";

export type UseAgentClientsReturn = {
  clients: AgentClient[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch agent's clients
 * Only works for authenticated agents
 */
export function useAgentClients(): UseAgentClientsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => s.user?.is_agent ?? false);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated && isAgent, [authReady, isAuthenticated, isAgent]);

  const {
    data: clientsResponse,
    isLoading,
    error,
    refetch: refetchClients,
  } = useQuery({
    queryKey: queryKeys.agent.clients(),
    queryFn: async () => {
      const response = await agentApi.getClients();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch clients");
      }
      return response.clients ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData function to check cache reactively when enabled changes
    placeholderData: () => {
      return queryClient.getQueryData<AgentClient[]>(queryKeys.agent.clients());
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });

  const refetch = useCallback(async () => {
    await refetchClients();
  }, [refetchClients]);

  return {
    clients: clientsResponse ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
