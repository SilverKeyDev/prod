import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useAuthStore } from "../../../store/auth.slice";
import { apiGet, apiPut } from "../../../services/http/compatibility";

export type ChecklistType = "escrow" | "financing" | "closing" | "insurance";

export type UseChecklistDataReturn = {
  checkedIds: number[];
  isLoading: boolean;
  error: string | null;
  toggleItem: (id: number) => Promise<void>;
  refreshChecklist: () => Promise<void>;
};

/**
 * Hook for managing checklist data with React Query
 * Uses prefetched data from services/data when available
 */
export function useChecklistData(type: ChecklistType): UseChecklistDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const queryKey = useMemo(() => ["checklists", type] as const, [type]);

  const {
    data: checkedIdsData,
    isLoading,
    error,
    refetch: refetchChecklist,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: number[] }>(
        `/api/v1/user/close?type=${type}`
      );
      if (!response.success) {
        throw new Error(`Failed to fetch ${type} checklist`);
      }
      return response.data ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData to check cache reactively when enabled changes
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<number[]>(queryKey);
      return cached ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiPut<{ success: boolean }>(
        `/api/v1/user/close?type=${type}`,
        ids
      );
      if (!response.success) {
        throw new Error(`Failed to update ${type} checklist`);
      }
      return ids;
    },
    onMutate: async (ids: number[]) => {
      // Optimistic update
      const previousIds = queryClient.getQueryData<number[]>(queryKey);
      queryClient.setQueryData(queryKey, ids);
      return { previousIds };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(queryKey, context.previousIds);
      }
    },
    onSuccess: (ids) => {
      // Update cache with server response
      queryClient.setQueryData(queryKey, ids);
    },
  });

  const toggleItem = useCallback(
    async (id: number) => {
      const currentIds = checkedIdsData ?? [];
      const isChecked = currentIds.includes(id);
      const newIds = isChecked
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];
      await updateChecklistMutation.mutateAsync(newIds);
    },
    [checkedIdsData, updateChecklistMutation]
  );

  const refreshChecklist = useCallback(async () => {
    await refetchChecklist();
  }, [refetchChecklist]);

  return {
    checkedIds: checkedIdsData ?? [],
    isLoading,
    error: error?.message ?? null,
    toggleItem,
    refreshChecklist,
  };
}
