import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isStaleLazyChunkError,
  isStaleLazyChunkMessage,
  resetStaleChunkRecoveryStateForTests,
  tryReloadForStaleChunkError,
} from "./shellRouteLoadTiming";

vi.mock("packages/config/env", () => ({
  isProduction: true,
}));

vi.mock("packages/logger", () => ({
  LOG_CATEGORIES: { ERRORS: "ERRORS" },
  log: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("staleChunkRecovery", () => {
  const reload = vi.fn();

  beforeEach(() => {
    resetStaleChunkRecoveryStateForTests();
    vi.stubGlobal("location", { reload });
    reload.mockClear();
  });

  afterEach(() => {
    resetStaleChunkRecoveryStateForTests();
    vi.unstubAllGlobals();
  });

  it("detects common stale lazy chunk messages", () => {
    expect(
      isStaleLazyChunkMessage(
        "Failed to fetch dynamically imported module: https://example/chunk.js"
      )
    ).toBe(true);
    expect(isStaleLazyChunkMessage("Loading chunk 42 failed")).toBe(true);
    expect(isStaleLazyChunkMessage("Network request failed")).toBe(false);
  });

  it("reloads once per session for stale chunk errors", () => {
    const error = new Error("Failed to fetch dynamically imported module");

    expect(tryReloadForStaleChunkError(error, "test")).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    expect(tryReloadForStaleChunkError(error, "test")).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignores non-stale errors", () => {
    expect(tryReloadForStaleChunkError(new Error("Something else broke"), "test")).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("accepts Error instances via isStaleLazyChunkError", () => {
    expect(isStaleLazyChunkError(new Error("error loading dynamically imported module"))).toBe(
      true
    );
    expect(isStaleLazyChunkError(new Error("timeout"))).toBe(false);
  });
});
