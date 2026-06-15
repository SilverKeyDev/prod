import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  getTaskChecklistProgressSummaryForSubject,
  type TaskChecklistProgressSummary,
} from "packages/features/checklists/api/checklists";
import type { UseChecklistDataOptions } from "packages/features/checklists/hooks/data/useChecklistData";
import { useResolvedTransactionId } from "packages/features/checklists/hooks/data/useResolvedTransactionId";
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

  const explicitTransactionId = options?.transactionId;
  const shouldResolveTransaction = explicitTransactionId == null;
  const { transactionId: resolvedTransactionId, isLoading: transactionIdLoading } =
    useResolvedTransactionId(undefined, { enabled: shouldResolveTransaction });
  const effectiveTransactionId = explicitTransactionId ?? resolvedTransactionId;

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);
  const queryEnabled =
    shouldLoadData &&
    options?.enabled !== false &&
    Boolean(effectiveTransactionId) &&
    (!shouldResolveTransaction || !transactionIdLoading);

  const queryKey = useMemo(
    () => ["checklists", "progress-summary", effectiveTransactionId ?? "pending"] as const,
    [effectiveTransactionId]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getTaskChecklistProgressSummaryForSubject(effectiveTransactionId!),
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  const combinedLoading =
    isLoading || (shouldResolveTransaction && transactionIdLoading && !effectiveTransactionId);

  return {
    summary: data,
    isLoading: combinedLoading,
    error: error?.message ?? null,
    refetch,
  };
}
