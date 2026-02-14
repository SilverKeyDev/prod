import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useFiltersQueryParams } from "../../../config/query/adapters";
import { queryKeys } from "../../../config/query/keys";
import { chatbotApi } from "../../../config/api/chat/chatbot";
import { reportApi } from "../../../config/api/documents/report";
import { useAuthStore } from "../../../store/auth.slice";
import { formatFilenameToAddress } from "../../../utils/address";

/**
 * Enhanced chat data hook with TanStack Query integration
 * Replaces ChatsContext with direct hook usage
 */
export const useChats = () => {
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  // Note: dataConfig prefetches conversations with queryKeys.agent.conversations()
  // but useChats uses queryKeys.chats.list(filters), so we check the conversations cache
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated],
  );
  const cachedConversations = useMemo(() => {
    if (!shouldLoadData) return undefined;
    // Check if conversations were prefetched (they use agent.conversations key)
    return queryClient.getQueryData(queryKeys.agent.conversations());
  }, [shouldLoadData, queryClient]);

  // Chats query - uses reports API to get chats (reports are the chats)
  const {
    data: reportsResponse,
    isLoading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery({
    queryKey: queryKeys.chats.list(filters),
    queryFn: async () => {
      // Check for shared reports data first (for performance)
      const windowWithSharedData = window as unknown as {
        sharedReportsData?: { timestamp: number; reports: unknown[] };
      };
      const sharedData = windowWithSharedData.sharedReportsData;
      const CACHE_TTL = 30000; // 30 seconds

      if (sharedData && Date.now() - sharedData.timestamp < CACHE_TTL) {
        const { reports } = sharedData;
        return reports.map((report: unknown) => {
          if (!report || typeof report !== "object") {
            throw new Error("Invalid report data structure");
          }
          const reportData = report as Record<string, unknown>;
          return {
            id:
              typeof reportData.id === "string"
                ? reportData.id
                : typeof reportData.id === "number"
                  ? String(reportData.id)
                  : "unknown",
            title:
              typeof reportData.address === "string"
                ? formatFilenameToAddress(reportData.address)
                : `Report ${typeof reportData.id === "string" ? reportData.id : typeof reportData.id === "number" ? String(reportData.id) : "unknown"}`,
            propertyAddress:
              typeof reportData.address === "string" ? reportData.address : "",
            messages: [],
            createdAt: new Date(
              typeof reportData.generatedAt === "number"
                ? reportData.generatedAt * 1000
                : Date.now(),
            ),
          };
        });
      }

      // Fallback to API
      const response = await reportApi.list();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch chats");
      }
      return (response.documents ?? []).map((doc) => ({
        id: doc.id,
        title: formatFilenameToAddress(doc.primary_address ?? doc.filename),
        propertyAddress: doc.primary_address ?? doc.filename,
        messages: [],
        createdAt: new Date(doc.created_at),
      }));
    },
    enabled: shouldLoadData,
    // Note: We don't use initialData here because chats use a different query key structure
    // (chats.list with filters vs agent.conversations), but refetchOnMount: false will
    // still use cached data if available
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
      const response = await chatbotApi.chatForAddress(reportId, message);
      return response;
    },
    onSuccess: () => {
      // Invalidate chats after sending a message
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });

  // Get chat history mutation
  const getChatHistoryMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await chatbotApi.getChatHistory(reportId);
      return response;
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
    chats: reportsResponse ?? [],
    chatsLoading,
    chatsError: chatsError?.message ?? null,
    refreshChats: refetchChats,
    sendMessage,
    getChatHistory,
  };
};
