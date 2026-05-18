import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAgentSyncPreferencesWhenClientSelected } from "./useAgentSyncPreferencesWhenClientSelected";

const syncFromClient = vi.fn();

vi.mock("packages/hooks/store", () => ({
  useActiveWorkspace: () => "agent",
}));

vi.mock("@/features/agent/hooks/data/clients/useAgentClients", () => ({
  useAgentClients: () => ({
    clients: [{ id: "client-1", name: "Alex", email: "alex@example.com" }],
  }),
}));

vi.mock("./useSyncAgentPreferencesFromClient", () => ({
  useSyncAgentPreferencesFromClient: () => ({ syncFromClient }),
}));

describe("useAgentSyncPreferencesWhenClientSelected", () => {
  it("does not sync when selectedClientId is null", async () => {
    renderHook(() => useAgentSyncPreferencesWhenClientSelected(null));

    await waitFor(() => {
      expect(syncFromClient).not.toHaveBeenCalled();
    });
  });

  it("syncs preferences when a client is selected in agent workspace", async () => {
    syncFromClient.mockResolvedValue(undefined);

    renderHook(() => useAgentSyncPreferencesWhenClientSelected("client-1"));

    await waitFor(() => {
      expect(syncFromClient).toHaveBeenCalledWith("client-1", "Alex");
    });
  });

  it("syncs only once per selected client id", async () => {
    syncFromClient.mockClear();
    syncFromClient.mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ clientId }: { clientId: string | null }) =>
        useAgentSyncPreferencesWhenClientSelected(clientId),
      { initialProps: { clientId: "client-1" as string | null } }
    );

    await waitFor(() => expect(syncFromClient).toHaveBeenCalledTimes(1));

    rerender({ clientId: "client-1" });
    await waitFor(() => expect(syncFromClient).toHaveBeenCalledTimes(1));
  });
});
