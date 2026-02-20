import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { agentApi } from "packages/config/api";
import { queryKeys } from "packages/config/query/keys";

export type UseEventRequestsReturn = {
  updateEventRequestStatus: (
    messageId: string,
    status: "accepted" | "cancelled",
  ) => Promise<{ success: boolean; error?: string }>;
  isUpdating: boolean;
};

/**
 * Hook to manage calendar event request status updates
 */
export function useEventRequests(): UseEventRequestsReturn {
  const queryClient = useQueryClient();

  // Update event request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      messageId,
      status,
    }: {
      messageId: string;
      status: "accepted" | "cancelled";
    }) => {
      const response = await agentApi.updateEventRequestStatus(
        messageId,
        status,
      );
      if (!response.success) {
        throw new Error(
          response.error ?? "Failed to update event request status",
        );
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate conversations and chats to refresh message status
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.conversations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.chats(),
      });
    },
  });

  const updateEventRequestStatus = useCallback(
    async (
      messageId: string,
      status: "accepted" | "cancelled",
    ): Promise<{ success: boolean; error?: string }> => {
      return await updateStatusMutation.mutateAsync({ messageId, status });
    },
    [updateStatusMutation],
  );

  return {
    updateEventRequestStatus,
    isUpdating: updateStatusMutation.isPending,
  };
}
