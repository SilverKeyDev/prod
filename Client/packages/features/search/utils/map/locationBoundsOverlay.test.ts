import { describe, expect, it } from "vitest";

import type { ViewportPolygonPoint } from "packages/types/domain/api";

import {
  buildIsochroneOverlayFromViewportRing,
  viewportRingToPolygonCoordinates,
} from "./locationBoundsOverlay";

describe("viewportRingToPolygonCoordinates", () => {
  it("emits GeoJSON lon/lat order and closes the ring", () => {
    const ring: ViewportPolygonPoint[] = [
      { lat: 33, lng: -118 },
      { lat: 33, lng: -117 },
      { lat: 32, lng: -117 },
      { lat: 32, lng: -118 },
      { lat: 33, lng: -118 },
    ];
    const coords = viewportRingToPolygonCoordinates(ring);
    expect(coords).toHaveLength(1);
    const outer = coords[0];
    expect(outer).toBeDefined();
    expect(outer![0]).toEqual([-118, 33]);
    expect(outer![1]).toEqual([-117, 33]);
    const first = outer![0];
    const last = outer![outer!.length - 1];
    expect(first).toEqual(last);
  });

  it("accepts lon alias on points", () => {
    const ring: ViewportPolygonPoint[] = [
      { lat: 1, lon: 2 },
      { lat: 1, lon: 3 },
      { lat: 0, lon: 3 },
      { lat: 0, lon: 2 },
      { lat: 1, lon: 2 },
    ];
    const outer = viewportRingToPolygonCoordinates(ring)[0];
    expect(outer![0]).toEqual([2, 1]);
  });
});

describe("buildIsochroneOverlayFromViewportRing", () => {
  it("returns Feature Polygon geometry compatible with map renderers", () => {
    const ring: ViewportPolygonPoint[] = [
      { lat: 10, lng: 20 },
      { lat: 10, lng: 21 },
      { lat: 9, lng: 21 },
      { lat: 9, lng: 20 },
      { lat: 10, lng: 20 },
    ];
    const data = buildIsochroneOverlayFromViewportRing(ring, { lat: 9.5, lng: 20.5 }, "Test City");
    expect(data.isochrone?.geometry?.type).toBe("Polygon");
    expect(data.isochrone?.geometry?.coordinates).toBeDefined();
    expect(data.center?.lat).toBe(9.5);
    expect(data.center?.lon).toBe(20.5);
    expect(data.center?.address).toBe("Test City");
  });
});
