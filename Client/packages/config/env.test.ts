/**
 * EnvConfig is a singleton. Each case uses vi.resetModules() + dynamic import("./env")
 * after stubbing process.env so getters read fresh values.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockWarn = vi.hoisted(() => vi.fn());

vi.mock("packages/logger", () => ({
  log: { warn: (...args: unknown[]) => mockWarn(...args) },
  LOG_CATEGORIES: { API: "API" },
}));

const ENV_KEYS = [
  "NODE_ENV",
  "EXPO_PUBLIC_GOOGLE_MAPS_ID",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID",
  "EXPO_PUBLIC_PLAID_CLIENT_ID",
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_API_BASE_URL",
  "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS",
  "EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR",
] as const;

const originalEnvSnapshot: Record<string, string | undefined> = {};

function snapshotEnv(): void {
  for (const key of ENV_KEYS) {
    originalEnvSnapshot[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = originalEnvSnapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  const g = global as unknown as { __fbBatchedBridge?: unknown };
  delete g.__fbBatchedBridge;
}

function applyEnv(overrides: Partial<Record<(typeof ENV_KEYS)[number], string>>): void {
  for (const key of ENV_KEYS) {
    if (key in overrides) {
      const value = overrides[key];
      if (value === undefined || value === "") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    } else {
      delete process.env[key];
    }
  }
}

async function loadFreshEnv() {
  vi.resetModules();
  return import("./env");
}

describe("EnvConfig", () => {
  beforeEach(() => {
    snapshotEnv();
    mockWarn.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  describe("googleMapsId", () => {
    it("returns trimmed EXPO_PUBLIC_GOOGLE_MAPS_ID when set", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "  cloud-map-123  ",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleMapsId).toBe("cloud-map-123");
    });

    it("falls back to EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS when web id is empty", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: "  ios-cloud-map  ",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleMapsId).toBe("ios-cloud-map");
    });

    it("prefers EXPO_PUBLIC_GOOGLE_MAPS_ID over iOS when both are set", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "web-map",
        EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: "ios-map",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleMapsId).toBe("web-map");
    });

    it("returns undefined when map id is not configured", async () => {
      applyEnv({ NODE_ENV: "development" });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleMapsId).toBeUndefined();
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("googleClientId and plaidClientId", () => {
    it("returns client ids when configured", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "map",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "google-client",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "plaid-client",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleClientId).toBe("google-client");
      expect(getEnv().plaidClientId).toBe("plaid-client");
    });

    it("returns null and warns when client ids are missing", async () => {
      applyEnv({ NODE_ENV: "development" });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().googleClientId).toBeNull();
      expect(getEnv().plaidClientId).toBeNull();
      expect(mockWarn.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("apiBaseUrl", () => {
    it("returns production URL when NODE_ENV is production", async () => {
      applyEnv({
        NODE_ENV: "production",
        EXPO_PUBLIC_API_URL: "http://should-be-ignored.test",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().apiBaseUrl).toBe("https://usesilverkey.com");
    });

    it("uses EXPO_PUBLIC_API_URL override in development", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
        EXPO_PUBLIC_API_URL: "http://api.example.test",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().apiBaseUrl).toBe("http://api.example.test");
    });

    it("uses EXPO_PUBLIC_API_BASE_URL when API_URL is unset", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
        EXPO_PUBLIC_API_BASE_URL: "http://base.example.test",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().apiBaseUrl).toBe("http://base.example.test");
    });

    it("returns empty string on web development with no override", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().apiBaseUrl).toBe("");
    });

    it("returns localhost default in React Native development with no override", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
      });
      (global as unknown as { __fbBatchedBridge?: unknown }).__fbBatchedBridge = {};
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().apiBaseUrl).toBe("http://localhost:5000");
    });
  });

  describe("getRaw and NODE_ENV flags", () => {
    it("returns trimmed iOS-specific raw env values", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: "  ios-map  ",
        EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR: " true ",
      });
      const { getEnv } = await loadFreshEnv();
      expect(getEnv().getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS")).toBe("ios-map");
      expect(getEnv().getRaw("EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR")).toBe("true");
    });

    it("reflects NODE_ENV in isDevelopment, isProduction, and getNodeEnv", async () => {
      applyEnv({
        NODE_ENV: "production",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
      });
      const prod = await loadFreshEnv();
      expect(prod.getEnv().isDevelopment).toBe(false);
      expect(prod.getEnv().isProduction).toBe(true);
      expect(prod.getEnv().getNodeEnv()).toBe("production");

      vi.resetModules();
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
      });
      const dev = await loadFreshEnv();
      expect(dev.getEnv().isDevelopment).toBe(true);
      expect(dev.getEnv().isProduction).toBe(false);
      expect(dev.getEnv().getNodeEnv()).toBe("development");
    });
  });

  describe("timeouts and retries", () => {
    it("exposes stable api timeout and retry defaults", async () => {
      applyEnv({
        NODE_ENV: "development",
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "m",
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "g",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "p",
      });
      const { getEnv, getDefaultTimeout, getDefaultRetries } = await loadFreshEnv();
      expect(getEnv().apiTimeout).toBe(30000);
      expect(getEnv().apiRetries).toBe(2);
      expect(getDefaultTimeout()).toBe(30000);
      expect(getDefaultRetries()).toBe(2);
    });
  });
});
