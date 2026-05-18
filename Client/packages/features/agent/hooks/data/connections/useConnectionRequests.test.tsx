import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

import { useConnectionRequests } from "./useConnectionRequests";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    getConnectionRequests: vi.fn(),
    createConnectionRequest: vi.fn(),
    respondToConnectionRequest: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

const inboxRequest: AgentConnectionRequest = {
  id: "req-inbox",
  agent_id: "agent-1",
  client_id: "client-1",
  requested_by_agent: true,
  status: "pending",
  created_at: "2024-01-01T00:00:00.000Z",
  message: null,
  other_party_name: "Client One",
  other_party_email: "client@example.com",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useConnectionRequests", () => {
  beforeEach(() => {
    vi.mocked(agentApi.getConnectionRequests).mockReset();
    vi.mocked(agentApi.createConnectionRequest).mockReset();
    vi.mocked(agentApi.respondToConnectionRequest).mockReset();
  });

  it("fetches inbox connection requests when inbox is enabled", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({
      success: true,
      requests: [inboxRequest],
    });

    const { result } = renderHook(() => useConnectionRequests(), { wrapper });

    await waitFor(() => {
      expect(result.current.requests).toEqual([inboxRequest]);
    });
    expect(agentApi.getConnectionRequests).toHaveBeenCalledWith("inbox");
  });

  it("skips inbox fetch when inboxEnabled is false", async () => {
    renderHook(() => useConnectionRequests({ inboxEnabled: false }), { wrapper });
    await waitFor(() => {
      expect(agentApi.getConnectionRequests).not.toHaveBeenCalled();
    });
  });

  it("createRequest calls API with agent and client ids", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({ success: true, requests: [] });
    vi.mocked(agentApi.createConnectionRequest).mockResolvedValue({
      success: true,
      request: inboxRequest,
      already_pending: false,
    });

    const { result } = renderHook(() => useConnectionRequests(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const createResult = await result.current.createRequest("agent-1", "client-1", "hello");
    expect(createResult.alreadyPending).toBe(false);
    expect(agentApi.createConnectionRequest).toHaveBeenCalledWith("agent-1", "client-1", "hello");
  });

  it("respondToRequest accepts a pending request", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({ success: true, requests: [] });
    vi.mocked(agentApi.respondToConnectionRequest).mockResolvedValue({
      success: true,
      request: { ...inboxRequest, status: "accepted" },
    });

    const { result } = renderHook(() => useConnectionRequests(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.respondToRequest("req-inbox", true);
    expect(agentApi.respondToConnectionRequest).toHaveBeenCalledWith("req-inbox", true);
  });
});
