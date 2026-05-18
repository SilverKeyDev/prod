import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

import {
  initiatedConnectionRequestsQueryKey,
  useInitiatedConnectionRequests,
} from "./useInitiatedConnectionRequests";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    getConnectionRequests: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

const pendingRequest: AgentConnectionRequest = {
  id: "req-1",
  agent_id: "agent-1",
  client_id: "client-1",
  requested_by_agent: false,
  status: "pending",
  created_at: "2024-01-01T00:00:00.000Z",
  message: null,
  other_party_name: "Taylor Agent",
  other_party_email: "taylor@example.com",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useInitiatedConnectionRequests", () => {
  beforeEach(() => {
    vi.mocked(agentApi.getConnectionRequests).mockReset();
  });

  it("fetches initiated connection requests with scope=initiated", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({
      success: true,
      requests: [pendingRequest],
    });

    const { result } = renderHook(() => useInitiatedConnectionRequests(true), { wrapper });

    await waitFor(() => {
      expect(result.current.requests).toEqual([pendingRequest]);
    });
    expect(agentApi.getConnectionRequests).toHaveBeenCalledWith("initiated");
    expect(initiatedConnectionRequestsQueryKey).toContain("initiated");
  });

  it("does not fetch when disabled", async () => {
    renderHook(() => useInitiatedConnectionRequests(false), { wrapper });
    await waitFor(() => {
      expect(agentApi.getConnectionRequests).not.toHaveBeenCalled();
    });
  });
});
