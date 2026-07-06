import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setPlatformGlobals } from "packages/utils/core/platform";

const mocks = vi.hoisted(() => ({
  mint: vi.fn(),
}));

vi.mock("packages/features/admin/api/admin", () => ({
  adminApi: {
    mintDevAccountSession: mocks.mint,
  },
}));

import {
  buildDevSessionUrl,
  useOpenDevAccountSessionMutation,
} from "./useOpenDevAccountSessionMutation";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useOpenDevAccountSessionMutation", () => {
  const openMock = vi.fn();

  beforeEach(() => {
    mocks.mint.mockReset();
    openMock.mockReset();
    setPlatformGlobals({
      window: { open: openMock } as Window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      fetch: globalThis.fetch,
    });
  });

  it("builds an encoded dev session URL", () => {
    expect(buildDevSessionUrl("a token+with symbols")).toBe(
      "/dev/session?t=a%20token%2Bwith%20symbols"
    );
  });

  it("mints a role token and opens a new tab", async () => {
    mocks.mint.mockResolvedValueOnce({
      token: "one-time-token",
      role: "buyer",
      user: { id: "u1" },
    });
    const { result } = renderHook(() => useOpenDevAccountSessionMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("buyer");
    });

    await waitFor(() => {
      expect(mocks.mint).toHaveBeenCalledWith({ workspace: "buyer" });
      expect(openMock).toHaveBeenCalledWith(
        "/dev/session?t=one-time-token",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });
});
