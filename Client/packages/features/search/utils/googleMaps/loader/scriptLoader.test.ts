import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScriptLoader } from "./scriptLoader";

const envState = vi.hoisted(() => ({
  googleMapsId: undefined as string | undefined,
}));

vi.mock("packages/config", () => ({
  env: {
    get googleMapsId() {
      return envState.googleMapsId;
    },
  },
}));

vi.mock("packages/logger", () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
  },
  LOG_CATEGORIES: { MAP_RENDERING: "MAP_RENDERING" },
}));

vi.mock("packages/api/maps", () => ({
  mapsApi: {},
}));

vi.mock("packages/utils/platform", () => ({
  getDocument: () => null,
  getWindow: () => undefined,
}));

vi.mock("packages/utils/storage/platformStorage", () => ({
  getSessionStorage: () => null,
}));

vi.mock("./googleMapsReadiness", () => ({
  isGoogleMapsReady: () => false,
}));

describe("ScriptLoader.getMapId", () => {
  beforeEach(() => {
    envState.googleMapsId = undefined;
  });

  it("returns map id from env when configured", () => {
    envState.googleMapsId = "cloud-map-123";
    const loader = new ScriptLoader();
    expect(loader.getMapId()).toBe("cloud-map-123");
  });

  it("returns undefined when env googleMapsId is not set", () => {
    envState.googleMapsId = undefined;
    const loader = new ScriptLoader();
    expect(loader.getMapId()).toBeUndefined();
  });
});
