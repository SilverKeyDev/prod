import { useEffect, useRef } from "react";

import { useIsAgent } from "packages/hooks/store";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";

import { useSyncAgentPreferencesFromClient } from "./useSyncAgentPreferencesFromClient";

/**
 * When an agent picks a client in Search (shared agent dashboard store), copy that client's
 * preferences onto the agent's account. The client's saved preferences are read-only to the agent;
 * only the agent's own profile is updated.
 *
 * Search correctness still requires `preferences_user_id` on polygon/isochrone requests so the
 * server loads the client's preference row (`resolve_preferences_user_id_for_research`). See
 * documentation/internal/search-preference-scoping-pilot.md.
 */
export function useAgentSyncPreferencesWhenClientSelected(selectedClientId: string | null): void {
  const isAgent = useIsAgent();
  const { clients } = useAgentClients();
  const { syncFromClient } = useSyncAgentPreferencesFromClient();
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const lastSyncedClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAgent) {
      return;
    }
    if (!selectedClientId) {
      lastSyncedClientIdRef.current = null;
      return;
    }
    if (lastSyncedClientIdRef.current === selectedClientId) {
      return;
    }
    lastSyncedClientIdRef.current = selectedClientId;
    const client = clientsRef.current.find((c) => c.id === selectedClientId);
    void syncFromClient(
      selectedClientId,
      client?.name?.trim() || client?.email?.trim() || undefined
    );
  }, [isAgent, selectedClientId, syncFromClient]);
}
