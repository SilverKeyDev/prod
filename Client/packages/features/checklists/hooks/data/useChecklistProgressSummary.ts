import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  getTaskChecklistProgressSummary,
  getTaskChecklistProgressSummaryForSubject,
  type TaskChecklistProgressSummary,
} from "packages/features/checklists/api/checklists";
import type { UseChecklistDataOptions } from "packages/features/checklists/hooks/data/useChecklistData";
import { useAuthStore } from "packages/store";

export type UseChecklistProgressSummaryReturn = {
  summary: TaskChecklistProgressSummary | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
};

export function useChecklistProgressSummary(
  options?: UseChecklistDataOptions
): UseChecklistProgressSummaryReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const checklistSubjectUserId = options?.checklistSubjectUserId;
  const transactionId = options?.transactionId ?? checklistSubjectUserId;

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);
  const subjectCacheKey = transactionId ?? "self";
  const queryEnabled = shouldLoadData && (transactionId == null || transactionId.length > 0);

  const queryKey = useMemo(
    () => ["checklists", "progress-summary", subjectCacheKey] as const,
    [subjectCacheKey]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      transactionId
        ? getTaskChecklistProgressSummaryForSubject(transactionId)
        : getTaskChecklistProgressSummary(),
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  return {
    summary: data,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
