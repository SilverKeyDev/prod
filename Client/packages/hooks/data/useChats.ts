import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useFiltersQueryParams } from "../../config/query/adapters";
import { queryKeys } from "../../config/query/keys";
import { chatService } from "../../services/chats";
import { useAuthStore } from "../../store/auth.slice";

/**
 * Enhanced chat data hook with TanStack Query integration
 * Replaces ChatsContext with direct hook usage
 */
export const useChats = () => {
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

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
    enabled: authReady && isAuthenticated,
    select: (data) => data,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false, // Don't refetch if data exists (matches reports)
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

  // Note: Cross-tab auth changes are no longer tracked via sessionStorage tokens
  // Authentication state is managed via HTTP-only cookies
  // The AuthContext handles cross-tab auth changes via custom events if needed

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
