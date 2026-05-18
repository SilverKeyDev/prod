import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getTaskChecklistForSubject } from "packages/features/checklists";

import { useClientHubChecklistPrefetch } from "./useClientHubChecklistPrefetch";

vi.mock("packages/features/checklists", () => ({
  getTaskChecklistForSubject: vi.fn(() => Promise.resolve({ tasks: [] })),
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, authReady: true }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useClientHubChecklistPrefetch", () => {
  it("does not prefetch when clientId is empty", async () => {
    const prefetchSpy = vi.spyOn(QueryClient.prototype, "prefetchQuery");

    renderHook(() => useClientHubChecklistPrefetch(""), { wrapper });

    await waitFor(() => {
      expect(prefetchSpy).not.toHaveBeenCalled();
    });

    prefetchSpy.mockRestore();
  });

  it("prefetches all client hub checklist types when authenticated", async () => {
    const prefetchSpy = vi
      .spyOn(QueryClient.prototype, "prefetchQuery")
      .mockResolvedValue(undefined);

    renderHook(() => useClientHubChecklistPrefetch("client-1"), { wrapper });

    await waitFor(() => {
      expect(prefetchSpy).toHaveBeenCalled();
    });

    const checklistTypes = ["search", "offer", "escrow", "insurance", "financing", "closing"];
    for (const type of checklistTypes) {
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["checklists", type, "client-1"],
        })
      );
    }

    const firstPrefetch = prefetchSpy.mock.calls[0]?.[0] as {
      queryFn: () => Promise<unknown>;
    };
    await firstPrefetch.queryFn();
    expect(getTaskChecklistForSubject).toHaveBeenCalledWith("client-1", "search");

    prefetchSpy.mockRestore();
  });
});
