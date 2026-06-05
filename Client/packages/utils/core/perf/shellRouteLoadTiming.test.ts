import { afterEach, describe, expect, it, vi } from "vitest";

import { resetTracedPrefetchStateForTests, tracedPrefetch } from "./shellRouteLoadTiming";

vi.mock("packages/logger", () => ({
  LOG_CATEGORIES: { ROUTING: "ROUTING" },
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("tracedPrefetch", () => {
  afterEach(() => {
    resetTracedPrefetchStateForTests();
    vi.clearAllMocks();
  });

  it("invokes load only once per label until rejection", async () => {
    const load = vi.fn(() => Promise.resolve({ ok: true }));

    tracedPrefetch("ROUTING", "prefetch:Test", load);
    tracedPrefetch("ROUTING", "prefetch:Test", load);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("allows retry after a failed prefetch", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"))
      .mockResolvedValueOnce({ ok: true });

    tracedPrefetch("ROUTING", "prefetch:Retry", load);
    await Promise.resolve();
    await Promise.resolve();

    tracedPrefetch("ROUTING", "prefetch:Retry", load);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
