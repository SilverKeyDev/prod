import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as checklistsApi from "packages/features/checklists/api/checklists";

import { useChecklistData } from "./useChecklistData";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (k: string, _opts?: { defaultValue?: string }) => k,
  }),
}));

vi.mock("packages/hooks/ui", () => ({
  showWarningToast: vi.fn(),
}));

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: { isAuthenticated: boolean; authReady: boolean }) => unknown) =>
    sel({ isAuthenticated: true, authReady: true }),
}));

vi.mock("./useResolvedTransactionId", () => ({
  useResolvedTransactionId: () => ({
    transactionId: "tx-123",
    isLoading: false,
  }),
}));

describe("useChecklistData", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.spyOn(checklistsApi, "getTaskChecklistForSubject").mockResolvedValue({
      items: [
        {
          id: 1,
          label: "A",
          explanation: "",
          order: 0,
          allow_unordered_check: true,
        },
      ],
      checkedIds: [],
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("does not start a second toggle while a PUT is still pending", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    const updateSpy = vi.spyOn(checklistsApi, "updateTaskChecklistForSubject").mockImplementation(
      () =>
        new Promise<number[]>((resolve) => {
          void gate.then(() => resolve([1]));
        })
    );

    const { result } = renderHook(() => useChecklistData("closing"), { wrapper });

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    void result.current.toggleItem(1);
    await waitFor(() => {
      expect(result.current.isChecklistUpdatePending).toBe(true);
    });

    await result.current.toggleItem(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    act(() => {
      release();
    });

    await waitFor(() => {
      expect(result.current.isChecklistUpdatePending).toBe(false);
    });

    updateSpy.mockRestore();
  });
});
