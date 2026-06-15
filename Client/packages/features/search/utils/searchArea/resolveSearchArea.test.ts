import { describe, expect, it, vi } from "vitest";

import { resolveSearchArea } from "./resolveSearchArea";

describe("resolveSearchArea", () => {
  const barRing = [
    { lat: 33.8, lng: -84.4 },
    { lat: 33.8, lng: -84.3 },
    { lat: 33.7, lng: -84.3 },
    { lat: 33.7, lng: -84.4 },
    { lat: 33.8, lng: -84.4 },
  ];

  it("uses location bar viewport when ring is present", async () => {
    const result = await resolveSearchArea({
      locationPlaceViewportRing: barRing,
      importantLocations: [{ address: "123 Main" }],
      fetchIsochrone: vi.fn(),
    });
    expect(result.mode).toBe("location_bar");
    expect(result.searchSource).toBe("location");
    expect(result.viewportRing).toEqual(barRing);
    expect(result.blocked).toBeUndefined();
  });

  it("uses isochrone when important locations exist and isochrone succeeds", async () => {
    const isochroneData = {
      isochrone: {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-84.4, 33.8],
              [-84.3, 33.8],
              [-84.3, 33.7],
              [-84.4, 33.7],
              [-84.4, 33.8],
            ],
          ],
        },
      },
      center: { lat: 33.75, lng: -84.35 },
    };
    const result = await resolveSearchArea({
      locationPlaceViewportRing: null,
      importantLocations: [{ address: "123 Main St" }],
      fetchIsochrone: async () => isochroneData,
    });
    expect(result.mode).toBe("isochrone");
    expect(result.searchSource).toBe("preferences");
    expect(result.isochroneData).toBe(isochroneData);
    expect(result.viewportRing.length).toBeGreaterThanOrEqual(4);
    expect(result.blocked).toBeUndefined();
  });

  it("falls back to geolocation when no bar ring and no important locations", async () => {
    const result = await resolveSearchArea({
      locationPlaceViewportRing: null,
      importantLocations: [],
      requestLocation: async () => ({ status: "granted", lat: 33.75, lng: -84.39 }),
      fetchIsochrone: async () => null,
    });
    expect(result.mode).toBe("geolocation");
    expect(result.searchSource).toBe("location");
    expect(result.warnings).toEqual([]);
    expect(result.blocked).toBeUndefined();
  });

  it("blocks search when geolocation is denied", async () => {
    const result = await resolveSearchArea({
      locationPlaceViewportRing: null,
      importantLocations: [],
      requestLocation: async () => ({ status: "denied" }),
      fetchIsochrone: async () => null,
    });
    expect(result.blocked).toBe(true);
    expect(result.warnings).toContain("geolocation_denied");
    expect(result.viewportRing).toEqual([]);
  });

  it("falls through to geolocation when isochrone fetch returns null", async () => {
    const result = await resolveSearchArea({
      locationPlaceViewportRing: null,
      importantLocations: [{ address: "123 Main" }],
      requestLocation: async () => ({ status: "granted", lat: 33.75, lng: -84.39 }),
      fetchIsochrone: async () => null,
    });
    expect(result.mode).toBe("geolocation");
    expect(result.blocked).toBeUndefined();
  });

  it("uses default market when geolocation is unavailable", async () => {
    const result = await resolveSearchArea({
      locationPlaceViewportRing: null,
      importantLocations: [],
      requestLocation: async () => ({ status: "unavailable" }),
      fetchIsochrone: async () => null,
    });
    expect(result.mode).toBe("default_market");
    expect(result.warnings).toContain("geolocation_unavailable");
    expect(result.blocked).toBeUndefined();
    expect(result.viewportRing.length).toBeGreaterThanOrEqual(4);
  });
});
