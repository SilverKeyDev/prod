import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ChecklistType,
  getTaskChecklist,
  type TaskChecklistResponse,
  updateTaskChecklist,
} from "packages/features/checklists/api/checklists";
import { getActiveChecklistItemIds } from "packages/features/checklists/utils/presentation/getActiveChecklistItemId";
import { mergeTaskChecklistCheckedIds } from "packages/features/checklists/utils/rules/checklistRules";
import { useAuthStore } from "packages/store";

export type { ChecklistType };

export type UseChecklistDataReturn = {
  items: TaskChecklistResponse["items"];
  checkedIds: number[];
  /** First incomplete step id (anchor for progressive layout). */
  activeItemId: number | null;
  /** All steps that should show as the current wave (e.g. parallel integration group). */
  activeItemIds: readonly number[];
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
    mutationFn: async (ids: number[]) => updateTaskChecklist(type, ids),
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
    onSuccess: (serverCheckedIds) => {
      queryClient.setQueryData(queryKey, (old: TaskChecklistResponse | undefined) =>
        old ? { ...old, checkedIds: serverCheckedIds } : { items: [], checkedIds: serverCheckedIds }
      );
    },
  });

  const toggleItem = useCallback(
    async (id: number) => {
      const items = checklistData?.items ?? [];
      const currentIds = checklistData?.checkedIds ?? [];
      const oldSet = new Set(currentIds);
      const isChecked = currentIds.includes(id);
      const requested = isChecked
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];
      const merged = mergeTaskChecklistCheckedIds(items, requested, oldSet);
      await updateChecklistMutation.mutateAsync(merged);
    },
    [checklistData?.checkedIds, checklistData?.items, updateChecklistMutation]
  );

  const refreshChecklist = useCallback(async () => {
    await refetchChecklist();
  }, [refetchChecklist]);

  const activeItemIds = useMemo(() => {
    const items = checklistData?.items ?? [];
    const checkedIds = checklistData?.checkedIds ?? [];
    return getActiveChecklistItemIds(items, checkedIds);
  }, [checklistData?.items, checklistData?.checkedIds]);

  const activeItemId = useMemo(() => activeItemIds[0] ?? null, [activeItemIds]);

  return {
    items: checklistData?.items ?? [],
    checkedIds: checklistData?.checkedIds ?? [],
    activeItemId,
    activeItemIds,
    isLoading,
    error: error?.message ?? null,
    toggleItem,
    refreshChecklist,
  };
}
