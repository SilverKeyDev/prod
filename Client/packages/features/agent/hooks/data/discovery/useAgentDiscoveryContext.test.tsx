import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildAgentDiscoveryRecommendationInput } from "@/features/agent/utils/agentDiscovery/buildAgentDiscoveryRecommendationInput";

import { useAgentDiscoveryContext } from "./useAgentDiscoveryContext";

vi.mock("packages/hooks/data/user/useUserData", () => ({
  useUserPreferences: () => ({ userPreferences: { preferred_bedrooms: 3 } }),
}));

vi.mock("packages/store", () => ({
  useSearchContextStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      locationPlaceLabel: "Austin, TX",
      searchFilterOverrides: { minPrice: 100000 },
    }),
}));

vi.mock("@/features/agent/utils/agentDiscovery/buildAgentDiscoveryRecommendationInput", () => ({
  buildAgentDiscoveryRecommendationInput: vi.fn(() => ({
    location_label: "Austin, TX",
    bedrooms_min: 3,
  })),
}));

describe("useAgentDiscoveryContext", () => {
  it("builds recommendation input from preferences and search context", () => {
    const { result } = renderHook(() => useAgentDiscoveryContext());

    expect(buildAgentDiscoveryRecommendationInput).toHaveBeenCalledWith({
      preferences: { preferred_bedrooms: 3 },
      locationPlaceLabel: "Austin, TX",
      searchFilterOverrides: { minPrice: 100000 },
    });
    expect(result.current).toEqual({
      location_label: "Austin, TX",
      bedrooms_min: 3,
    });
  });
});
