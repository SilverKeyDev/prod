import { useCallback, useMemo } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useIsAgent } from "packages/hooks/store";
import { HttpError } from "packages/services/http/compatibility";
import { useAuthStore } from "packages/store";

import type { AgentClient } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

const EMPTY_AGENT_CLIENTS: AgentClient[] = [];

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
  const isAgent = useIsAgent();

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && isAgent,
    [authReady, isAuthenticated, isAgent]
  );

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
    staleTime: 30 * 1000, // 30 seconds - keep in sync with dataConfig.agentClients
    // Default refetchOnMount: refetch only when stale so returning to Messaging stays instant.
    // Don't retry on client errors (4xx), but retry once on server errors (5xx)
    retry: (failureCount, error) => {
      // Check HttpError status directly
      if (error instanceof HttpError) {
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry once on server errors (5xx) - they might be transient
        if (error.status >= 500) {
          return failureCount < 1;
        }
      }
      // For other errors, retry once
      return failureCount < 1;
    },
  });

  const refetch = useCallback(async () => {
    await refetchClients();
  }, [refetchClients]);

  return {
    clients: clientsResponse ?? EMPTY_AGENT_CLIENTS,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
