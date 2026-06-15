import { describe, expect, it } from "vitest";

import { resolveGoogleMapsCloudMapId } from "./resolveGoogleMapsCloudMapId";

describe("resolveGoogleMapsCloudMapId", () => {
  it("returns trimmed EXPO_PUBLIC map id when set", () => {
    expect(resolveGoogleMapsCloudMapId("cloud-map-123")).toBe("cloud-map-123");
    expect(resolveGoogleMapsCloudMapId("  map-a  ")).toBe("map-a");
  });

  it("returns undefined when map id is missing or blank", () => {
    expect(resolveGoogleMapsCloudMapId("")).toBeUndefined();
    expect(resolveGoogleMapsCloudMapId(undefined)).toBeUndefined();
    expect(resolveGoogleMapsCloudMapId("   ")).toBeUndefined();
  });
});
