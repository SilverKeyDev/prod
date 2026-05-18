import { describe, expect, it } from "vitest";

import { resolveGoogleMapsCloudMapId } from "./resolveGoogleMapsCloudMapId";

describe("resolveGoogleMapsCloudMapId", () => {
  it("returns EXPO_PUBLIC map id when set", () => {
    expect(resolveGoogleMapsCloudMapId("cloud-map-123", "legacy-vite-id")).toBe("cloud-map-123");
  });

  it("falls back to legacy VITE map id when EXPO_PUBLIC is empty", () => {
    expect(resolveGoogleMapsCloudMapId("", "legacy-vite-id")).toBe("legacy-vite-id");
    expect(resolveGoogleMapsCloudMapId(undefined, "legacy-vite-id")).toBe("legacy-vite-id");
  });

  it("returns undefined when neither id is configured", () => {
    expect(resolveGoogleMapsCloudMapId("", "")).toBeUndefined();
    expect(resolveGoogleMapsCloudMapId(undefined, undefined)).toBeUndefined();
  });

  it("trims whitespace from configured ids", () => {
    expect(resolveGoogleMapsCloudMapId("  map-a  ", undefined)).toBe("map-a");
  });
});
