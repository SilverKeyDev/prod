import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getMyTransaction, type Transaction } from "packages/features/checklists/api/checklists";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

export type UseMyTransactionReturn = {
  transaction: Transaction | undefined;
  transactionId: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
};

/**
 * Resolves the authenticated buyer's active deal (`GET /api/v1/transactions/me`).
 */
export function useMyTransaction(options?: { enabled?: boolean }): UseMyTransactionReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const enabled = options?.enabled !== false && authReady && isAuthenticated;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions", "me"] as const,
    queryFn: async () => getMyTransaction(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const transaction = useMemo(() => data?.transaction, [data?.transaction]);
  const transactionId = useMemo(() => transaction?.id ?? null, [transaction?.id]);

  return {
    transaction,
    transactionId,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : resolveApiResultErrorMessage(error, "Failed to fetch transaction")
      : null,
    refetch,
  };
}
