import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { partnersApi } from "packages/features/partners/api/partners";

import { usePartnerPlacements } from "./usePartnerPlacements";

vi.mock("packages/features/partners/api/partners", () => ({
  partnersApi: {
    getPlacements: vi.fn(),
    recordStepView: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("packages/hooks/store", () => ({
  useActiveWorkspace: () => "buyer",
}));

describe("usePartnerPlacements", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(partnersApi.getPlacements).mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("loads placements with step and workspace only (no transaction required)", async () => {
    const { result } = renderHook(() => usePartnerPlacements("closing:13"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(partnersApi.getPlacements).toHaveBeenCalledWith("closing:13", "buyer", undefined);
    expect(partnersApi.recordStepView).not.toHaveBeenCalled();
  });

  it("includes optional transaction id in the request and records step view", async () => {
    const { result } = renderHook(() => usePartnerPlacements("closing:13", "txn-1", "seller"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(partnersApi.getPlacements).toHaveBeenCalledWith("closing:13", "seller", "txn-1");
    expect(partnersApi.recordStepView).toHaveBeenCalledWith("closing:13", "txn-1");

    const cacheKey = queryClient
      .getQueryCache()
      .findAll({ queryKey: ["partners", "placements", "closing:13", "txn-1", "seller"] });
    expect(cacheKey.length).toBe(1);
  });
});
