import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { agentApi } from "../../../config/api";
import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import type { AgentConnectionRequest } from "../../../config/api";

export type UseConnectionRequestsReturn = {
  requests: AgentConnectionRequest[];
  isLoading: boolean;
  error: string | null;
  refreshRequests: () => Promise<void>;
  createRequest: (agentId: string, clientId: string, message?: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  isCreatingRequest: boolean;
  isResponding: boolean;
};

/**
 * Hook to manage connection requests
 */
export function useConnectionRequests(): UseConnectionRequestsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Fetch connection requests
  const {
    data: requestsData,
    isLoading,
    error,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: [...queryKeys.agent.all, "connection-requests"] as const,
    queryFn: async () => {
      const response = await agentApi.getConnectionRequests();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch connection requests");
      }
      return response.requests ?? [];
    },
    enabled: authReady && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: false, // Don't refetch if data exists (use cached data from initial load)
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async ({
      agentId,
      clientId,
      message,
    }: {
      agentId: string;
      clientId: string;
      message?: string;
    }) => {
      const response = await agentApi.createConnectionRequest(agentId, clientId, message);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to create connection request");
      }
      return response.request;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.agent.all, "connection-requests"] as const,
      });
    },
  });

  // Respond to request mutation
  const respondMutation = useMutation({
    mutationFn: async ({
      requestId,
      accept,
    }: {
      requestId: string;
      accept: boolean;
    }) => {
      const response = await agentApi.respondToConnectionRequest(requestId, accept);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to respond to connection request");
      }
      return response.request;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.agent.all, "connection-requests"] as const,
      });
      // Also invalidate conversations and clients since accepting creates a connection
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.conversations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.clients(),
      });
    },
  });

  const refreshRequests = useCallback(async () => {
    await refetchRequests();
  }, [refetchRequests]);

  const createRequest = useCallback(
    async (agentId: string, clientId: string, message?: string) => {
      await createRequestMutation.mutateAsync({ agentId, clientId, message });
    },
    [createRequestMutation]
  );

  const respondToRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      await respondMutation.mutateAsync({ requestId, accept });
    },
    [respondMutation]
  );

  return {
    requests: requestsData ?? [],
    isLoading,
    error: error?.message ?? null,
    refreshRequests,
    createRequest,
    respondToRequest,
    isCreatingRequest: createRequestMutation.isPending,
    isResponding: respondMutation.isPending,
  };
}
