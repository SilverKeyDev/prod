import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ChecklistType,
  getTaskChecklist,
  type TaskChecklistResponse,
  updateTaskChecklist,
} from "packages/features/checklists/api/checklists";
import { getActiveChecklistItemId } from "packages/features/checklists/utils/getActiveChecklistItemId";
import { useAuthStore } from "packages/store";

export type { ChecklistType };

export type UseChecklistDataReturn = {
  items: TaskChecklistResponse["items"];
  checkedIds: number[];
  activeItemId: number | null;
  isLoading: boolean;
  error: string | null;
  toggleItem: (id: number) => Promise<void>;
  refreshChecklist: () => Promise<void>;
};

/**
 * Hook for managing checklist data with React Query.
 * Uses unified task API: returns items (definitions) + checkedIds (progress).
 * Uses prefetched data from services/data when available.
 */
export function useChecklistData(type: ChecklistType): UseChecklistDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const queryKey = useMemo(() => ["checklists", type] as const, [type]);

  const {
    data: checklistData,
    isLoading,
    error,
    refetch: refetchChecklist,
  } = useQuery({
    queryKey,
    queryFn: () => getTaskChecklist(type),
    enabled: shouldLoadData,
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<TaskChecklistResponse>(queryKey);
      return cached ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await updateTaskChecklist(type, ids);
      return ids;
    },
    onMutate: async (ids: number[]) => {
      const previous = queryClient.getQueryData<TaskChecklistResponse>(queryKey);
      queryClient.setQueryData(queryKey, (old: TaskChecklistResponse | undefined) =>
        old ? { ...old, checkedIds: ids } : { items: [], checkedIds: ids }
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (ids) => {
      queryClient.setQueryData(queryKey, (old: TaskChecklistResponse | undefined) =>
        old ? { ...old, checkedIds: ids } : { items: [], checkedIds: ids }
      );
    },
  });

  const toggleItem = useCallback(
    async (id: number) => {
      const currentIds = checklistData?.checkedIds ?? [];
      const isChecked = currentIds.includes(id);
      const newIds = isChecked ? currentIds.filter((itemId) => itemId !== id) : [...currentIds, id];
      await updateChecklistMutation.mutateAsync(newIds);
    },
    [checklistData?.checkedIds, updateChecklistMutation]
  );

  const refreshChecklist = useCallback(async () => {
    await refetchChecklist();
  }, [refetchChecklist]);

  const activeItemId = useMemo(() => {
    const items = checklistData?.items ?? [];
    const checkedIds = checklistData?.checkedIds ?? [];
    return getActiveChecklistItemId(items, checkedIds);
  }, [checklistData?.items, checklistData?.checkedIds]);

  return {
    items: checklistData?.items ?? [],
    checkedIds: checklistData?.checkedIds ?? [],
    activeItemId,
    isLoading,
    error: error?.message ?? null,
    toggleItem,
    refreshChecklist,
  };
}
