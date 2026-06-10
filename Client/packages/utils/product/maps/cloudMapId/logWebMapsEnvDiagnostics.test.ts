import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInfo = vi.hoisted(() => vi.fn());
const mockWarn = vi.hoisted(() => vi.fn());
const mockGetRaw = vi.hoisted(() => vi.fn());
const mockIsProduction = vi.hoisted(() => vi.fn(() => false));

vi.mock("packages/logger", () => ({
  log: {
    info: (...args: unknown[]) => mockInfo(...args),
    warn: (...args: unknown[]) => mockWarn(...args),
  },
  LOG_CATEGORIES: { MAP_RENDERING: "MAP_RENDERING" },
}));

vi.mock("packages/config/env", () => ({
  getEnv: () => ({
    getRaw: mockGetRaw,
    get isProduction() {
      return mockIsProduction();
    },
  }),
}));

import { maskMapIdForLog } from "./logWebMapsEnvDiagnostics";

describe("maskMapIdForLog", () => {
  it("masks suffix without exposing full id", () => {
    expect(maskMapIdForLog("abcdef1234")).toEqual({
      mapIdLength: 10,
      mapIdSuffix: "1234",
    });
  });

  it("returns empty mask for missing id", () => {
    expect(maskMapIdForLog(undefined)).toEqual({ mapIdLength: 0, mapIdSuffix: "" });
  });
});

describe("logWebMapsEnvDiagnostics", () => {
  beforeEach(() => {
    mockInfo.mockClear();
    mockWarn.mockClear();
    mockGetRaw.mockReset();
    mockIsProduction.mockReturnValue(false);
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  async function loadDiagnostics() {
    return import("./logWebMapsEnvDiagnostics");
  }

  it("logs warn when map id is not configured", async () => {
    mockGetRaw.mockImplementation((key: string) => {
      if (key === "EXPO_PUBLIC_GOOGLE_MAPS_ID") return "";
      if (key === "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS") return "";
      return "";
    });
    const { logWebMapsEnvDiagnostics } = await loadDiagnostics();
    logWebMapsEnvDiagnostics({ phase: "env" });
    expect(mockWarn).toHaveBeenCalled();
    expect(mockInfo).not.toHaveBeenCalled();
  });

  it("logs info with masked suffix when configured", async () => {
    mockGetRaw.mockImplementation((key: string) => {
      if (key === "EXPO_PUBLIC_GOOGLE_MAPS_ID") return "cloud-map-1234";
      return "";
    });
    const { logWebMapsEnvDiagnostics } = await loadDiagnostics();
    logWebMapsEnvDiagnostics({ phase: "env" });
    expect(mockInfo).toHaveBeenCalledWith(
      "MAP_RENDERING",
      "Web Maps Cloud Map ID diagnostics",
      expect.objectContaining({
        configured: true,
        source: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
        mapIdSuffix: "1234",
        mapIdLength: 14,
      })
    );
  });

  it("includes instanceMapIdPresent when map is provided", async () => {
    mockGetRaw.mockImplementation((key: string) => {
      if (key === "EXPO_PUBLIC_GOOGLE_MAPS_ID") return "live-map-9999";
      return "";
    });
    const { logWebMapsEnvDiagnostics } = await loadDiagnostics();
    const map = {
      getMapId: () => "live-map-9999",
    } as google.maps.Map;
    logWebMapsEnvDiagnostics({ phase: "map_instance", map });
    expect(mockInfo).toHaveBeenCalledWith(
      "MAP_RENDERING",
      "Web Maps Cloud Map ID diagnostics",
      expect.objectContaining({
        instanceMapIdPresent: true,
        mapIdSuffix: "9999",
      })
    );
  });
});
