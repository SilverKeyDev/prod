import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMocks = vi.hoisted(() => ({
  init: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  get_distinct_id: vi.fn(() => "distinct-1"),
  get_session_id: vi.fn(() => "session-1"),
}));

const envMocks = vi.hoisted(() => ({
  posthogKey: "phc_test_key",
}));

const windowMocks = vi.hoisted(() => ({
  hasWindow: true,
}));

vi.mock("posthog-js", () => ({
  default: posthogMocks,
}));

vi.mock("packages/config/env", () => ({
  getEnv: () => ({
    posthogKey: envMocks.posthogKey,
  }),
}));

vi.mock("packages/utils", () => ({
  getWindow: () => (windowMocks.hasWindow ? ({} as Window) : null),
}));

describe("buildPostHogWebInitOptions", () => {
  it("returns US cloud api_host and ui_host (not localhost)", async () => {
    const { buildPostHogWebInitOptions } = await import("./posthogClient");
    const options = buildPostHogWebInitOptions();

    expect(options.api_host).toBe("https://us.i.posthog.com");
    expect(options.ui_host).toBe("https://us.posthog.com");
    expect(options.api_host).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(options.ui_host).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(options.person_profiles).toBe("identified_only");
    expect(options.capture_pageview).toBe(true);
    expect(options.capture_pageleave).toBe(true);
  });
});

describe("initPostHogClient", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    envMocks.posthogKey = "phc_test_key";
    windowMocks.hasWindow = true;
    vi.resetModules();
  });

  it("calls posthog.init with US cloud hosts when key and window are present", async () => {
    const { initPostHogClient } = await import("./posthogClient");

    expect(initPostHogClient()).toBe(true);
    expect(posthogMocks.init).toHaveBeenCalledOnce();
    expect(posthogMocks.init).toHaveBeenCalledWith("phc_test_key", {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  });

  it("skips init when PostHog key is missing", async () => {
    envMocks.posthogKey = "";
    const { initPostHogClient } = await import("./posthogClient");

    expect(initPostHogClient()).toBe(false);
    expect(posthogMocks.init).not.toHaveBeenCalled();
  });

  it("skips init when window is unavailable", async () => {
    windowMocks.hasWindow = false;
    const { initPostHogClient } = await import("./posthogClient");

    expect(initPostHogClient()).toBe(false);
    expect(posthogMocks.init).not.toHaveBeenCalled();
  });
});
