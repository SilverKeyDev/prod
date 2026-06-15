import { describe, expect, it, vi } from "vitest";

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

import {
  canUseWebAdvancedMarkers,
  isWebCloudMapIdConfigured,
  mapHasCloudMapId,
} from "./webAdvancedMarkers";

describe("webAdvancedMarkers", () => {
  it("isWebCloudMapIdConfigured reflects env.googleMapsId", () => {
    envState.googleMapsId = undefined;
    expect(isWebCloudMapIdConfigured()).toBe(false);

    envState.googleMapsId = "cloud-map-123";
    expect(isWebCloudMapIdConfigured()).toBe(true);

    envState.googleMapsId = "   ";
    expect(isWebCloudMapIdConfigured()).toBe(false);
  });

  it("mapHasCloudMapId uses getMapId when present", () => {
    const map = {
      getMapId: () => "instance-map-id",
    } as google.maps.Map;

    expect(mapHasCloudMapId(map)).toBe(true);
    expect(mapHasCloudMapId({ getMapId: () => "" } as google.maps.Map)).toBe(false);
  });

  it("mapHasCloudMapId falls back to env when getMapId is missing", () => {
    envState.googleMapsId = "env-map";
    expect(mapHasCloudMapId({} as google.maps.Map)).toBe(true);

    envState.googleMapsId = undefined;
    expect(mapHasCloudMapId({} as google.maps.Map)).toBe(false);
  });

  it("canUseWebAdvancedMarkers prefers map instance when provided", () => {
    envState.googleMapsId = "env-map";
    expect(canUseWebAdvancedMarkers({ getMapId: () => "" } as google.maps.Map)).toBe(false);
    expect(canUseWebAdvancedMarkers({ getMapId: () => "live-map" } as google.maps.Map)).toBe(true);
    expect(canUseWebAdvancedMarkers()).toBe(true);
  });
});
