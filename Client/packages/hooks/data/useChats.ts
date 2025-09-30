import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

import { useFiltersQueryParams } from "../../config/query/adapters";
import { queryKeys } from "../../config/query/keys";
import { chatService } from "../../services/chats";
import { useAuth } from "../../contexts";

/**
 * Enhanced chat data hook with TanStack Query integration
 * Replaces ChatsContext with direct hook usage
 */
export const useChats = () => {
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();
  const { isAuthenticated, authReady } = useAuth();

  // Additional check to ensure access token is available
  // This prevents race conditions during login
  const hasAccessToken =
    typeof window !== "undefined" &&
    sessionStorage.getItem("access_token") !== null &&
    sessionStorage.getItem("access_token") !== "http-only-cookie-auth";

  // Chats query
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery({
    queryKey: queryKeys.chats.list(filters),
    queryFn: async () => {
      const chatsData = await chatService.fetchChats();
      return chatsData;
    },
    enabled: authReady && isAuthenticated && hasAccessToken,
    select: (data) => data,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      reportId,
      message,
    }: {
      reportId: string;
      message: string;
    }) => {
      return await chatService.sendMessage(reportId, message);
    },
    onSuccess: () => {
      // Invalidate chats after sending a message
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });

  // Get chat history mutation
  const getChatHistoryMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await chatService.getChatHistory(reportId);
    },
  });

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
        } else {
          // Clear everything
          void queryClient.removeQueries({ queryKey: queryKeys.chats.all });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  // Public functions
  const sendMessage = useCallback(
    async (reportId: string, message: string) => {
      return sendMessageMutation.mutateAsync({ reportId, message });
    },
    [sendMessageMutation],
  );

  const getChatHistory = useCallback(
    async (reportId: string) => {
      return getChatHistoryMutation.mutateAsync(reportId);
    },
    [getChatHistoryMutation],
  );

  return {
    chats: chatsData ?? [],
    chatsLoading,
    chatsError: chatsError?.message ?? null,
    refreshChats: refetchChats,
    sendMessage,
    getChatHistory,
  };
};
