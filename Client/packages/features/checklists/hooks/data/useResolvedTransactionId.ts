import { useMemo } from "react";

import { useIsAgent } from "packages/hooks/store";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";

import { useMyTransaction } from "./useMyTransaction";

/**
 * Resolve `transactions.id` for checklist/rev-share APIs.
 * - Buyer self: GET /transactions/me
 * - Agent viewing a client: `AgentClient.transaction_id`
 */
export function useResolvedTransactionId(
  clientUserId?: string | null,
  options?: { enabled?: boolean }
): {
  transactionId: string | null;
  isLoading: boolean;
} {
  const isAgent = useIsAgent();
  const enabled = options?.enabled !== false;
  const { clients, isLoading: clientsLoading } = useAgentClients();
  const { transactionId: myTransactionId, isLoading: myTxLoading } = useMyTransaction({
    enabled: enabled && (!isAgent || !clientUserId),
  });

  const transactionId = useMemo(() => {
    if (!enabled) {
      return null;
    }
    if (clientUserId) {
      return clients.find((c) => c.id === clientUserId)?.transaction_id ?? null;
    }
    return myTransactionId;
  }, [clientUserId, clients, enabled, myTransactionId]);

  const isLoading = !enabled ? false : clientUserId ? clientsLoading : myTxLoading;

  return { transactionId, isLoading };
}
