import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMocks = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("posthog-js", () => ({
  default: posthogMocks,
}));

import { emitPostHogLog } from "./posthogLogSink";

describe("emitPostHogLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends structured attributes via posthog.logger.info", () => {
    emitPostHogLog("INFO", "API", "request complete", { status: 200 });

    expect(posthogMocks.logger.info).toHaveBeenCalledWith(
      "request complete",
      expect.objectContaining({
        "log.category": "API",
        "log.source": "silverkey-logger",
        "service.name": "silverkey-web",
        "log.data": expect.stringContaining("200"),
      })
    );
  });

  it("maps SECURITY to warn severity", () => {
    emitPostHogLog("SECURITY", "SECURITY", "auth failure");

    expect(posthogMocks.logger.warn).toHaveBeenCalledWith(
      "auth failure",
      expect.objectContaining({
        "log.category": "SECURITY",
      })
    );
  });

  it("includes subcategory when provided", () => {
    emitPostHogLog("DEBUG", "API", "poll", undefined, "POLLING");

    expect(posthogMocks.logger.debug).toHaveBeenCalledWith(
      "poll",
      expect.objectContaining({
        "log.subcategory": "POLLING",
      })
    );
  });
});
