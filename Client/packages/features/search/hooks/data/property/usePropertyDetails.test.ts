import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { researchApi } from "@/features/search/api/research";

import { usePropertyDetails } from "./usePropertyDetails";

vi.mock("packages/logger", () => ({
  log: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
  LOG_CATEGORIES: { SEARCH: "search" },
}));

vi.mock("packages/hooks/store", () => ({
  useActiveWorkspace: vi.fn(() => "buyer"),
}));

const mockUseAgentDashboardStore = vi.fn(
  (selector: (s: { selectedClientId: string | null }) => unknown) =>
    selector({ selectedClientId: null })
);

vi.mock("packages/store", () => ({
  useAgentDashboardStore: (selector: (s: { selectedClientId: string | null }) => unknown) =>
    mockUseAgentDashboardStore(selector),
}));

vi.mock("@/features/search/api/research", () => ({
  researchApi: {
    streamProperty: vi.fn(),
  },
}));

const baseProperty = {
  address: "123 Main St",
  zpid: 12345,
};

async function* streamEvents(
  events: Array<{ type: string; data: unknown }>
): AsyncGenerator<{ type: string; data: unknown }> {
  for (const event of events) {
    yield event;
  }
}

describe("usePropertyDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(researchApi.streamProperty).mockReset();
  });

  it("merges stream updates and clears loading on complete", async () => {
    vi.mocked(researchApi.streamProperty).mockReturnValue(
      streamEvents([
        { type: "basic", data: { data: { price: "$450,000" } } },
        { type: "complete", data: null },
      ]) as never
    );

    const { result } = renderHook(() => usePropertyDetails());

    await act(async () => {
      await result.current.fetchPropertyDetails(baseProperty as never);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.selectedProperty).toMatchObject({
      address: "123 Main St",
      price: "$450,000",
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error when stream yields error event", async () => {
    vi.mocked(researchApi.streamProperty).mockReturnValue(
      streamEvents([{ type: "error", data: { message: "Listing unavailable" } }]) as never
    );

    const { result } = renderHook(() => usePropertyDetails());

    await act(async () => {
      await result.current.fetchPropertyDetails(baseProperty as never);
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Listing unavailable");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("includes preferences_user_id for agent workspace with selected client", async () => {
    const { useActiveWorkspace } = await import("packages/hooks/store");
    vi.mocked(useActiveWorkspace).mockReturnValue("agent");
    mockUseAgentDashboardStore.mockImplementation(
      (selector: (s: { selectedClientId: string | null }) => unknown) =>
        selector({ selectedClientId: "client-99" })
    );
    vi.mocked(researchApi.streamProperty).mockReturnValue(
      streamEvents([{ type: "complete", data: null }]) as never
    );

    const { result } = renderHook(() => usePropertyDetails());

    await act(async () => {
      await result.current.fetchPropertyDetails(baseProperty as never);
    });

    expect(researchApi.streamProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "123 Main St",
        zpid: "12345",
        preferences_user_id: "client-99",
      })
    );
  });

  it("sets error message when generator throws", async () => {
    vi.mocked(researchApi.streamProperty).mockImplementation(async function* () {
      throw new Error("Stream failed");
    });

    const { result } = renderHook(() => usePropertyDetails());

    await act(async () => {
      await result.current.fetchPropertyDetails(baseProperty as never);
    });

    expect(result.current.error).toBe("Stream failed");
    expect(result.current.isLoading).toBe(false);
  });

  it("clearSelectedProperty resets state", async () => {
    vi.mocked(researchApi.streamProperty).mockReturnValue(
      streamEvents([{ type: "complete", data: null }]) as never
    );

    const { result } = renderHook(() => usePropertyDetails());

    await act(async () => {
      await result.current.fetchPropertyDetails(baseProperty as never);
    });

    act(() => {
      result.current.clearSelectedProperty();
    });

    expect(result.current.selectedProperty).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
