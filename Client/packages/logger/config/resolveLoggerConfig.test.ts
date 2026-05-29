import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  applyProductionGuard,
  buildEnvironmentDefaults,
  resolveLoggerConfig,
} from "./resolveLoggerConfig";

describe("resolveLoggerConfig", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVerbose = process.env.EXPO_PUBLIC_LOGGER_VERBOSE;
  const originalCategories = process.env.EXPO_PUBLIC_LOGGER_CATEGORIES;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    delete process.env.EXPO_PUBLIC_LOGGER_VERBOSE;
    delete process.env.EXPO_PUBLIC_LOGGER_CATEGORIES;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVerbose === undefined) {
      delete process.env.EXPO_PUBLIC_LOGGER_VERBOSE;
    } else {
      process.env.EXPO_PUBLIC_LOGGER_VERBOSE = originalVerbose;
    }
    if (originalCategories === undefined) {
      delete process.env.EXPO_PUBLIC_LOGGER_CATEGORIES;
    } else {
      process.env.EXPO_PUBLIC_LOGGER_CATEGORIES = originalCategories;
    }
  });

  it("defaults dev categories off except errors and security", () => {
    const config = resolveLoggerConfig();

    expect(config.polling).toBe(false);
    expect(config.search).toBe(false);
    expect(config.errors).toBe(true);
    expect(config.security).toBe(true);
    expect(config.logLevel).toBe("ERROR");
  });

  it("defaults prod categories on", () => {
    process.env.NODE_ENV = "production";
    const config = resolveLoggerConfig();

    expect(config.polling).toBe(true);
    expect(config.search).toBe(true);
    expect(config.api).toEqual({
      initialLoad: true,
      polling: true,
      pageMount: true,
      other: true,
    });
    expect(config.logLevel).toBe("INFO");
  });

  it("enables listed dev categories from env", () => {
    process.env.EXPO_PUBLIC_LOGGER_CATEGORIES = "search,api";
    const config = resolveLoggerConfig();

    expect(config.search).toBe(true);
    expect(config.api).toEqual({
      initialLoad: true,
      polling: true,
      pageMount: true,
      other: true,
    });
    expect(config.polling).toBe(false);
  });

  it("applyProductionGuard forces all categories on", () => {
    const guarded = applyProductionGuard(buildEnvironmentDefaults(false));
    expect(guarded.polling).toBe(true);
    expect(guarded.documents).toBe(true);
  });
});
