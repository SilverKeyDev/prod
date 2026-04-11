import { describe, expect, it } from "vitest";

import type { IsochroneData } from "packages/types/api";

import { buildNeighborhoodPolygonFromLocations } from "./neighborhoodPolygon";

describe("buildNeighborhoodPolygonFromLocations", () => {
  it("should return null when locations array is empty", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [],
      center: { lat: 0, lon: 0, address: "" },
      locations: [],
      commute_tolerance: 30,
      mode: "driving",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    expect(result).toBeNull();
  });

  it("should return null when locations have no valid coordinates", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [],
      center: { lat: 0, lon: 0, address: "" },
      locations: [{ lat: null, lon: null, address: "Test" }] as never,
      commute_tolerance: 30,
      mode: "driving",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    expect(result).toBeNull();
  });

  it("should create a bounding box polygon from single location", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [],
      center: { lat: 40.7128, lon: -74.006, address: "NYC" },
      locations: [{ lat: 40.7128, lon: -74.006, address: "New York, NY" }],
      commute_tolerance: 30,
      mode: "driving",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    expect(result).not.toBeNull();
    expect(result?.isochrone.type).toBe("Feature");
    expect(result?.isochrone.geometry.type).toBe("Polygon");
    expect(result?.isochrone.geometry.coordinates).toHaveLength(1);
    expect(result?.isochrone.geometry.coordinates[0]).toHaveLength(5); // Rectangle with closed ring
    expect(result?.locations).toEqual(isochroneData.locations);
  });

  it("should create a bounding box polygon from multiple locations", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [],
      center: { lat: 40.7128, lon: -74.006, address: "NYC" },
      locations: [
        { lat: 40.7128, lon: -74.006, address: "New York, NY" },
        { lat: 40.7589, lon: -73.9851, address: "Times Square, NY" },
        { lat: 40.7589, lon: -73.9851, address: "Central Park, NY" },
      ],
      commute_tolerance: 30,
      mode: "driving",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    expect(result).not.toBeNull();
    expect(result?.isochrone.geometry.coordinates[0]).toHaveLength(5);

    // Verify the bounding box has proper padding
    const coords = result?.isochrone.geometry.coordinates[0];
    if (coords) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);

      // Check that the box extends beyond the original points (due to padding)
      expect(Math.min(...lngs)).toBeLessThan(-74.006);
      expect(Math.max(...lngs)).toBeGreaterThan(-73.9851);
      expect(Math.min(...lats)).toBeLessThan(40.7128);
      expect(Math.max(...lats)).toBeGreaterThan(40.7589);
    }
  });

  it("should preserve center and metadata from original isochrone data", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [],
      center: { lat: 40.7128, lon: -74.006, address: "NYC" },
      locations: [{ lat: 40.7128, lon: -74.006, address: "New York, NY" }],
      commute_tolerance: 45,
      mode: "transit",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    expect(result?.center).toEqual(isochroneData.center);
    expect(result?.commute_tolerance).toBe(45);
    expect(result?.mode).toBe("transit");
    expect(result?.locations).toEqual(isochroneData.locations);
  });

  it("should create an empty individual_isochrones array", () => {
    const isochroneData: IsochroneData = {
      isochrone: {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
      },
      individual_isochrones: [
        {
          address: "Test",
          commute_tolerance: 30,
          name: "Test Location",
          isochrone: {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [] },
          },
        },
      ],
      center: { lat: 40.7128, lon: -74.006, address: "NYC" },
      locations: [{ lat: 40.7128, lon: -74.006, address: "New York, NY" }],
      commute_tolerance: 30,
      mode: "driving",
    };

    const result = buildNeighborhoodPolygonFromLocations(isochroneData);

    // Neighborhood polygon should not include individual isochrones
    expect(result?.individual_isochrones).toEqual([]);
  });
});
