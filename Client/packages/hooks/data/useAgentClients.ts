import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { agentService } from "../../services/agent";
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const {
    data: clients,
    isLoading,
    error,
    refetch: refetchClients,
  } = useQuery({
    queryKey: queryKeys.agent.clients(),
    queryFn: async () => {
      return await agentService.fetchClients();
    },
    enabled: authReady && isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });

  const refetch = useCallback(async () => {
    await refetchClients();
  }, [refetchClients]);

  return {
    clients: clients ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
