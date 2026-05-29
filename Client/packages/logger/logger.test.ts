import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const posthogEmit = vi.hoisted(() => vi.fn());

vi.mock("./sinks/posthogLogSink", () => ({
  emitPostHogLog: posthogEmit,
}));

import { LOG_CATEGORIES } from "./core/categories";
import type { log as LogApi } from "./logger";

describe("logger emit gating", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPosthog = process.env.EXPO_PUBLIC_LOGGER_POSTHOG;
  let log: typeof LogApi;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    ({ log } = await import("./logger"));
  });

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    delete process.env.EXPO_PUBLIC_LOGGER_POSTHOG;
    vi.clearAllMocks();
    log.updateConfig({
      polling: false,
      pages: false,
      hooks: false,
      auth: false,
      http: false,
      api: {
        initialLoad: false,
        polling: false,
        pageMount: false,
        other: false,
      },
      search: false,
      logLevel: "ERROR",
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalPosthog === undefined) {
      delete process.env.EXPO_PUBLIC_LOGGER_POSTHOG;
    } else {
      process.env.EXPO_PUBLIC_LOGGER_POSTHOG = originalPosthog;
    }
  });

  it("does not console-log disabled categories in dev", () => {
    log.info(LOG_CATEGORIES.POLLING, "polling message");
    expect(infoSpy).not.toHaveBeenCalled();
    expect(posthogEmit).not.toHaveBeenCalled();
  });

  it("console-logs enabled categories in dev", () => {
    log.updateConfig({ polling: true, logLevel: "INFO" });
    log.info(LOG_CATEGORIES.POLLING, "polling message");
    expect(infoSpy).toHaveBeenCalled();
    expect(posthogEmit).not.toHaveBeenCalled();
  });

  it("exports to PostHog in dev when opted in", () => {
    process.env.EXPO_PUBLIC_LOGGER_POSTHOG = "1";
    log.updateConfig({ polling: true, logLevel: "INFO" });
    log.info(LOG_CATEGORIES.POLLING, "polling message");
    expect(posthogEmit).toHaveBeenCalled();
  });

  it("always emits errors category in dev", () => {
    log.error(LOG_CATEGORIES.ERRORS, "failure");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("accepts dot-notation LogPath for API subcategories", () => {
    log.updateConfig({
      api: { initialLoad: false, polling: true, pageMount: false, other: false },
      logLevel: "INFO",
    });
    log.info("API.POLLING", "dot path message");
    expect(infoSpy).toHaveBeenCalled();
  });
});
