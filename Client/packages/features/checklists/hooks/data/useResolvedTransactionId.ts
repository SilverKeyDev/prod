import { useMemo } from "react";

import { useIsAgent } from "packages/hooks/store";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";

import { useMyTransaction } from "./useMyTransaction";

/**
 * Resolve `transactions.id` for checklist/rev-share APIs.
 * - Buyer self: GET /transactions/me
 * - Agent viewing a client: `AgentClient.transaction_id`
 */
export function useResolvedTransactionId(clientUserId?: string | null): {
  transactionId: string | null;
  isLoading: boolean;
} {
  const isAgent = useIsAgent();
  const { clients, isLoading: clientsLoading } = useAgentClients();
  const { transactionId: myTransactionId, isLoading: myTxLoading } = useMyTransaction({
    enabled: !isAgent || !clientUserId,
  });

  const transactionId = useMemo(() => {
    if (clientUserId) {
      return clients.find((c) => c.id === clientUserId)?.transaction_id ?? null;
    }
    return myTransactionId;
  }, [clientUserId, clients, myTransactionId]);

  const isLoading = clientUserId ? clientsLoading : myTxLoading;

  return { transactionId, isLoading };
}
