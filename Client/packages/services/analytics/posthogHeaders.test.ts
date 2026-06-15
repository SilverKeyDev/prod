import { describe, expect, it, vi } from "vitest";

import { POSTHOG_DISTINCT_ID_HEADER, POSTHOG_SESSION_ID_HEADER } from "./posthogHeaders";

vi.mock("./posthogClient", () => ({
  isPostHogInitialized: vi.fn(() => true),
  getPostHogDistinctId: vi.fn(() => "distinct-123"),
  getPostHogSessionId: vi.fn(() => "session-456"),
}));

describe("getPostHogRequestHeaders", () => {
  it("returns distinct and session headers when PostHog is initialized", async () => {
    const { getPostHogRequestHeaders } = await import("./posthogHeaders");
    expect(getPostHogRequestHeaders()).toEqual({
      [POSTHOG_DISTINCT_ID_HEADER]: "distinct-123",
      [POSTHOG_SESSION_ID_HEADER]: "session-456",
    });
  });
});
