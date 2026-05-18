import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentClient } from "@/features/agent/api/agent";
import { agentApi } from "@/features/agent/api/agent";

import { useAgentClients } from "./useAgentClients";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    getClients: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

vi.mock("packages/hooks/store", () => ({
  useIsAgent: vi.fn(() => true),
}));

import { useIsAgent } from "packages/hooks/store";

const mockClient: AgentClient = {
  id: "client-1",
  name: "Alex Client",
  email: "alex@example.com",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAgentClients", () => {
  beforeEach(() => {
    vi.mocked(agentApi.getClients).mockReset();
    vi.mocked(useIsAgent).mockReturnValue(true);
  });

  it("returns clients when user is an authenticated agent", async () => {
    vi.mocked(agentApi.getClients).mockResolvedValue({
      success: true,
      clients: [mockClient],
    });

    const { result } = renderHook(() => useAgentClients(), { wrapper });

    await waitFor(() => {
      expect(result.current.clients).toEqual([mockClient]);
    });
    expect(agentApi.getClients).toHaveBeenCalled();
  });

  it("does not fetch when user is not an agent", async () => {
    vi.mocked(useIsAgent).mockReturnValue(false);

    renderHook(() => useAgentClients(), { wrapper });

    await waitFor(() => {
      expect(agentApi.getClients).not.toHaveBeenCalled();
    });
  });
});
