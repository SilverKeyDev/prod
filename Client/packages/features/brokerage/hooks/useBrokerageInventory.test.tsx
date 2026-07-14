import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const fetchBrokerageInventory = vi.fn();

vi.mock("packages/features/brokerage/api/analytics", () => ({
  fetchBrokerageInventory: (...args: unknown[]) => fetchBrokerageInventory(...args),
}));

vi.mock("packages/features/brokerage/hooks/useBrokerageOrgId", () => ({
  useBrokerageOrgId: () => "org-test-123",
}));

import { buildBrokerageInventory, useBrokerageInventory } from "./useBrokerageInventory";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useBrokerageInventory", () => {
  it("loads period-scaled fixture listings without calling the inventory API", async () => {
    const { result } = renderHook(() => useBrokerageInventory("month"), { wrapper });

    await waitFor(() => {
      expect(result.current.listings.length).toBe(buildBrokerageInventory("month").length);
    });

    expect(fetchBrokerageInventory).not.toHaveBeenCalled();
    expect(result.current.metrics.total_count).toBe(result.current.listings.length);
  });

  it("returns fewer listings for week than for all", async () => {
    const week = renderHook(() => useBrokerageInventory("week"), { wrapper });
    const all = renderHook(() => useBrokerageInventory("all"), { wrapper });

    await waitFor(() => {
      expect(week.result.current.listings.length).toBeGreaterThan(0);
      expect(all.result.current.listings.length).toBeGreaterThan(
        week.result.current.listings.length
      );
    });
  });
});
