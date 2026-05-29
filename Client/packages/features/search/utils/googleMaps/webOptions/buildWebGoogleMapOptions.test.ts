import { describe, expect, it } from "vitest";

import { buildWebGoogleMapOptions } from "./buildWebGoogleMapOptions";

describe("buildWebGoogleMapOptions", () => {
  it("applies mapId for Cloud styling when configured", () => {
    const options = buildWebGoogleMapOptions("silverkey-cloud-style");

    expect(options.mapId).toBe("silverkey-cloud-style");
    expect(options.disableDefaultUI).toBe(true);
    expect(options.gestureHandling).toBe("greedy");
  });

  it("omits mapId when not configured (default Google basemap)", () => {
    const options = buildWebGoogleMapOptions(undefined);

    expect(options.mapId).toBeUndefined();
    expect(options.center).toEqual({ lat: 33.75, lng: -84.39 });
    expect(options.zoom).toBe(12);
  });

  it("merges overrides without stripping mapId", () => {
    const options = buildWebGoogleMapOptions("cloud-map-123", {
      streetViewControl: true,
      zoom: 14,
    });

    expect(options.mapId).toBe("cloud-map-123");
    expect(options.streetViewControl).toBe(true);
    expect(options.zoom).toBe(14);
  });

  it("allows explicit mapId override", () => {
    const options = buildWebGoogleMapOptions("default-id", {
      mapId: "override-id",
    });

    expect(options.mapId).toBe("override-id");
  });

  it("allows clearing mapId when override is empty string", () => {
    const options = buildWebGoogleMapOptions("default-id", {
      mapId: "",
    });

    expect(options.mapId).toBeUndefined();
  });
});
