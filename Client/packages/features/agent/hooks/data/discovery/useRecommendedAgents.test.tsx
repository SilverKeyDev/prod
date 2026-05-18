import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { agentApi } from "@/features/agent/api/agent";

import { useRecommendedAgents } from "./useRecommendedAgents";

vi.mock("@/features/agent/api/agent", () => ({
  agentApi: {
    recommendedAgents: vi.fn(),
  },
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

const context = { location_label: "Austin, TX" };

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useRecommendedAgents", () => {
  beforeEach(() => {
    vi.mocked(agentApi.recommendedAgents).mockReset();
  });

  it("loads recommended agents for the given context", async () => {
    vi.mocked(agentApi.recommendedAgents).mockResolvedValue({
      success: true,
      agents: [{ id: "agent-1", name: "Taylor" }],
    });

    const { result } = renderHook(() => useRecommendedAgents(context, true), { wrapper });

    await waitFor(() => {
      expect(result.current.recommendedAgents).toHaveLength(1);
    });
    expect(agentApi.recommendedAgents).toHaveBeenCalledWith(
      expect.objectContaining({ location_label: "Austin, TX", limit: 20 })
    );
  });

  it("surfaces error when API returns success false", async () => {
    vi.mocked(agentApi.recommendedAgents).mockResolvedValue({
      success: false,
    });

    const { result } = renderHook(() => useRecommendedAgents(context, true), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
