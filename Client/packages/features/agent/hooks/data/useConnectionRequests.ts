import { useCallback } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

export type UseConnectionRequestsReturn = {
  requests: AgentConnectionRequest[];
  isLoading: boolean;
  error: string | null;
  refreshRequests: () => Promise<void>;
  createRequest: (
    agentId: string,
    clientId: string,
    message?: string,
  ) => Promise<{ alreadyPending: boolean }>;
  /** Create a connection request. Pass initiator (current user) and other party. Handles agentId/clientId order. */
  createRequestAsInitiator: (
    initiatorId: string,
    otherPartyId: string,
    isAgent: boolean,
    message?: string,
  ) => Promise<{ alreadyPending: boolean }>;
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
        throw new Error(
          response.error ?? "Failed to fetch connection requests",
        );
      }
      return response.requests ?? [];
    },
    enabled: authReady && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds - keep in sync with dataConfig
    refetchOnMount: "always",
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
      const response = await agentApi.createConnectionRequest(
        agentId,
        clientId,
        message,
      );
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to create connection request",
        );
      }
      return {
        request: response.request,
        alreadyPending: response.already_pending === true,
      };
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
      const response = await agentApi.respondToConnectionRequest(
        requestId,
        accept,
      );
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to respond to connection request",
        );
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
      const result = await createRequestMutation.mutateAsync({
        agentId,
        clientId,
        message,
      });
      return { alreadyPending: result.alreadyPending };
    },
    [createRequestMutation],
  );

  const createRequestAsInitiator = useCallback(
    async (
      initiatorId: string,
      otherPartyId: string,
      isAgent: boolean,
      message?: string,
    ) => {
      if (isAgent) {
        return createRequest(initiatorId, otherPartyId, message);
      }
      return createRequest(otherPartyId, initiatorId, message);
    },
    [createRequest],
  );

  const respondToRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      await respondMutation.mutateAsync({ requestId, accept });
    },
    [respondMutation],
  );

  return {
    requests: requestsData ?? [],
    isLoading,
    error: error?.message ?? null,
    refreshRequests,
    createRequest,
    createRequestAsInitiator,
    respondToRequest,
    isCreatingRequest: createRequestMutation.isPending,
    isResponding: respondMutation.isPending,
  };
}
