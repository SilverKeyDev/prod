import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";

import { useAgentSearchShareBundleSend } from "./useAgentSearchShareBundleSend";

/**
 * Data for the agent search share dock (client list + send). Lives in hooks so
 * search UI does not import agent feature internals.
 */
export function useAgentSearchShareBundleDock(): {
  clients: ReturnType<typeof useAgentClients>["clients"];
  isLoadingClients: boolean;
  sendBundle: ReturnType<typeof useAgentSearchShareBundleSend>["sendBundle"];
  isSending: boolean;
} {
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { sendBundle, isSending } = useAgentSearchShareBundleSend();

  return {
    clients,
    isLoadingClients,
    sendBundle,
    isSending,
  };
}
