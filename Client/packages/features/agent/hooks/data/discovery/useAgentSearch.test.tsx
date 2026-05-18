import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { agentApi } from "@/features/agent/api/agent";

import { useAgentSearch, useClientSearch } from "./useAgentSearch";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    searchAgents: vi.fn(),
    searchClients: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAgentSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(agentApi.searchAgents).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not search until query is at least 2 characters after debounce", async () => {
    renderHook(() => useAgentSearch("a", true), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(agentApi.searchAgents).not.toHaveBeenCalled();
  });

  it("searches agents after debounce when query is long enough", async () => {
    vi.mocked(agentApi.searchAgents).mockResolvedValue({
      success: true,
      agents: [{ id: "agent-1", name: "Taylor" }],
    });

    const { result } = renderHook(() => useAgentSearch("tay", true), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(result.current.agents).toHaveLength(1);
    });
    expect(agentApi.searchAgents).toHaveBeenCalledWith("tay");
  });
});

describe("useClientSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(agentApi.searchClients).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("searches clients after debounce when enabled", async () => {
    vi.mocked(agentApi.searchClients).mockResolvedValue({
      success: true,
      clients: [{ id: "client-1", name: "Alex" }],
    });

    const { result } = renderHook(() => useClientSearch("ale", true), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(result.current.clients).toHaveLength(1);
    });
    expect(agentApi.searchClients).toHaveBeenCalledWith("ale");
  });
});
