import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

import { useAgentConnectionDisplayStatus } from "./useAgentConnectionDisplayStatus";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    getConnectionRequests: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

vi.mock("packages/features/messaging/hooks/data/useAgentChats", () => ({
  useAgentChats: () => ({
    conversations: [
      {
        id: "c1",
        agent_id: "agent-connected",
        client_id: "client-1",
        agent_name: "Connected Agent",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
    ],
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAgentConnectionDisplayStatus", () => {
  it("returns accepted when agent appears in conversations", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({
      success: true,
      requests: [],
    });

    const { result } = renderHook(() => useAgentConnectionDisplayStatus(true), { wrapper });

    await waitFor(() => {
      expect(result.current.getConnectionStatus("agent-connected")).toBe("accepted");
    });
  });

  it("returns pending from initiated requests when not connected", async () => {
    const pending: AgentConnectionRequest = {
      id: "req-1",
      agent_id: "agent-pending",
      client_id: "client-1",
      requested_by_agent: false,
      status: "pending",
      created_at: "2024-02-01T00:00:00.000Z",
      message: null,
      other_party_name: null,
      other_party_email: null,
    };
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({
      success: true,
      requests: [pending],
    });

    const { result } = renderHook(() => useAgentConnectionDisplayStatus(true), { wrapper });

    await waitFor(() => {
      expect(result.current.getConnectionStatus("agent-pending")).toBe("pending");
    });
    expect(result.current.getConnectionStatus("agent-unknown")).toBe("none");
  });

  it("returns declined for rejected initiated request", async () => {
    vi.mocked(agentApi.getConnectionRequests).mockResolvedValue({
      success: true,
      requests: [
        {
          id: "req-2",
          agent_id: "agent-declined",
          client_id: "client-1",
          requested_by_agent: false,
          status: "rejected",
          created_at: "2024-01-01T00:00:00.000Z",
          message: null,
          other_party_name: null,
          other_party_email: null,
        },
      ],
    });

    const { result } = renderHook(() => useAgentConnectionDisplayStatus(true), { wrapper });

    await waitFor(() => {
      expect(result.current.getConnectionStatus("agent-declined")).toBe("declined");
    });
  });
});
