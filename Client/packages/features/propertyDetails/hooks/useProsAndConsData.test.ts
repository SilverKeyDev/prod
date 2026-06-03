import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProsAndConsData } from "./useProsAndConsData";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string, opts?: { defaultValue?: string; percent?: number }) => {
      if (opts?.defaultValue) {
        return opts.defaultValue.replace("{{percent}}", String(opts.percent ?? ""));
      }
      return key;
    },
  }),
}));

vi.mock("packages/hooks/store", () => ({
  useIsAgent: vi.fn(() => false),
}));

const mockUseAgentDashboardStore = vi.fn(
  (selector: (s: { selectedClientId: string | null }) => unknown) =>
    selector({ selectedClientId: null })
);

vi.mock("packages/store", () => ({
  useAgentDashboardStore: (selector: (s: { selectedClientId: string | null }) => unknown) =>
    mockUseAgentDashboardStore(selector),
}));

describe("useProsAndConsData", () => {
  beforeEach(async () => {
    const { useIsAgent } = await import("packages/hooks/store");
    vi.mocked(useIsAgent).mockReturnValue(false);
    mockUseAgentDashboardStore.mockImplementation(
      (selector: (s: { selectedClientId: string | null }) => unknown) =>
        selector({ selectedClientId: null })
    );
  });

  it("returns null context line for buyer", () => {
    const { result } = renderHook(() =>
      useProsAndConsData({
        property_analysis: {
          pros: ["Spacious kitchen"],
          cons: [{ text: "Busy road", severity: "warning" }],
        },
        _score: 85,
      })
    );

    expect(result.current.contextLine).toBeNull();
    expect(result.current.prosList).toHaveLength(1);
    expect(result.current.consList).toHaveLength(1);
    expect(result.current.highlightsSubtitle).toContain("%");
  });

  it("shows client context for agent with selected client", async () => {
    const { useIsAgent } = await import("packages/hooks/store");
    vi.mocked(useIsAgent).mockReturnValue(true);
    mockUseAgentDashboardStore.mockImplementation(
      (selector: (s: { selectedClientId: string | null }) => unknown) =>
        selector({ selectedClientId: "client-1" })
    );

    const { result } = renderHook(() =>
      useProsAndConsData({
        property_analysis: { pros: ["Pool"], cons: [] },
      })
    );

    expect(result.current.contextLine).toContain("selected client");
  });

  it("uses due-diligence subtitle for agent without client", async () => {
    const { useIsAgent } = await import("packages/hooks/store");
    vi.mocked(useIsAgent).mockReturnValue(true);

    const { result } = renderHook(() =>
      useProsAndConsData({
        property_analysis: { pros: ["Garage"], cons: ["HOA"] },
      })
    );

    expect(result.current.contextLine).toContain("Professional due-diligence");
    expect(result.current.highlightsSubtitle).toContain("Strengths and tradeoffs");
  });

  it("filters empty pros and cons after normalization", () => {
    const { result } = renderHook(() =>
      useProsAndConsData({
        property_analysis: {
          pros: ["", "  "],
          cons: [{ text: "   " }],
        },
      })
    );

    expect(result.current.prosList).toHaveLength(0);
    expect(result.current.consList).toHaveLength(0);
  });
});
