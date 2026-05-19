import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistType,
  getTaskChecklist,
  getTaskChecklistForSubject,
  type TaskChecklistResponse,
  updateTaskChecklist,
  updateTaskChecklistForSubject,
} from "packages/features/checklists/api/checklists";
import { getActiveChecklistItemIds } from "packages/features/checklists/utils/presentation/getActiveChecklistItemId";
import { mergeTaskChecklistCheckedIds } from "packages/features/checklists/utils/rules/checklistRules";
import { showWarningToast } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";

export type { ChecklistType };

export type UseChecklistDataOptions = {
  /**
   * Buyer user id whose checklist is read/written (`/transactions/:id/tasks`).
   * Omit for the authenticated user (`/api/v1/tasks`).
   */
  checklistSubjectUserId?: string | null;
  /**
   * Agent managing a client checklist: bypass submit-gated pruning on optimistic PUT merge
   * (server applies the same when actor_user_id != subject_user_id).
   */
  isAgentViewer?: boolean;
};

export type UseChecklistDataReturn = {
  items: TaskChecklistResponse["items"];
  checkedIds: number[];
  /** First incomplete step id (anchor for progressive layout). */
  activeItemId: number | null;
  /** All steps that should show as the current wave (e.g. parallel integration group). */
  activeItemIds: readonly number[];
  isLoading: boolean;
  /** True while a checklist PUT is in flight (checkbox or integration submit). */
  isChecklistUpdatePending: boolean;
  error: string | null;
  toggleItem: (id: number) => Promise<void>;
  refreshChecklist: () => Promise<void>;
};

/**
 * Hook for managing checklist data with React Query.
 * Uses unified task API: returns items (definitions) + checkedIds (progress).
 * Uses prefetched data from services/data when available.
 */
export function useChecklistData(
  type: ChecklistType,
  options?: UseChecklistDataOptions
): UseChecklistDataReturn {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const checklistSubjectUserId = options?.checklistSubjectUserId;
  const isAgentViewer = options?.isAgentViewer === true;

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const subjectCacheKey = checklistSubjectUserId ?? "self";
  const queryEnabled =
    shouldLoadData && (checklistSubjectUserId == null || checklistSubjectUserId.length > 0);

  const queryKey = useMemo(
    () => ["checklists", type, subjectCacheKey] as const,
    [type, subjectCacheKey]
  );

  const {
    data: checklistData,
    isLoading,
    error,
    refetch: refetchChecklist,
  } = useQuery({
    queryKey,
    queryFn: () =>
      checklistSubjectUserId
        ? getTaskChecklistForSubject(checklistSubjectUserId, type)
        : getTaskChecklist(type),
    enabled: queryEnabled,
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<TaskChecklistResponse>(queryKey);
      return cached ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async (ids: number[]) =>
      checklistSubjectUserId
        ? updateTaskChecklistForSubject(checklistSubjectUserId, type, ids)
        : updateTaskChecklist(type, ids),
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
      if (updateChecklistMutation.isPending) {
        return;
      }
      const items = checklistData?.items ?? [];
      const currentIds = checklistData?.checkedIds ?? [];
      const oldSet = new Set(currentIds);
      const isChecked = currentIds.includes(id);
      const requested = isChecked
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];
      const merged = mergeTaskChecklistCheckedIds(items, requested, oldSet, {
        bypassProgressGates: isAgentViewer,
      });
      const serverCheckedIds = await updateChecklistMutation.mutateAsync(merged);
      if (!isChecked && !serverCheckedIds.includes(id)) {
        showWarningToast(
          t("checklists.step_merge_not_applied", {
            defaultValue:
              "This step could not be marked complete yet. Finish earlier steps or required details, then try again.",
          })
        );
      }
    },
    [checklistData?.checkedIds, checklistData?.items, isAgentViewer, t, updateChecklistMutation]
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
    isChecklistUpdatePending: updateChecklistMutation.isPending,
    error: error?.message ?? null,
    toggleItem,
    refreshChecklist,
  };
}
