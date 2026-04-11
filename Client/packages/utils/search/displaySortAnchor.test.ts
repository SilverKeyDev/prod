import { describe, expect, it } from "vitest";

import {
  distanceKmForSort,
  haversineKm,
  resolveDistanceSortMode,
} from "./displaySortAnchor";

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm({ lat: 40, lng: -74 }, { lat: 40, lng: -74 })).toBe(0);
  });

  it("is symmetric", () => {
    const a = { lat: 47.6, lng: -122.3 };
    const b = { lat: 40.7, lng: -74 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});

describe("resolveDistanceSortMode", () => {
  it("prefers user geolocation", () => {
    const m = resolveDistanceSortMode({
      userGeolocation: { lat: 1, lng: 2 },
      searchBarAnchor: { lat: 9, lng: 9 },
      importantLocations: [{ lat: 3, lng: 4 }],
    });
    expect(m).toEqual({ type: "point", anchor: { lat: 1, lng: 2 } });
  });

  it("uses search bar when no user geo", () => {
    const m = resolveDistanceSortMode({
      userGeolocation: null,
      searchBarAnchor: { lat: 5, lng: 6 },
      importantLocations: [{ lat: 3, lng: 4 }],
    });
    expect(m).toEqual({ type: "point", anchor: { lat: 5, lng: 6 } });
  });

  it("uses single important location", () => {
    const m = resolveDistanceSortMode({
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [{ lat: 3, lng: 4 }],
    });
    expect(m).toEqual({ type: "point", anchor: { lat: 3, lng: 4 } });
  });

  it("uses minOf for multiple important locations", () => {
    const m = resolveDistanceSortMode({
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ],
    });
    expect(m).toEqual({
      type: "minOf",
      points: [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ],
    });
  });

  it("returns none when no anchors", () => {
    expect(
      resolveDistanceSortMode({
        userGeolocation: null,
        searchBarAnchor: null,
        importantLocations: [],
      }),
    ).toEqual({ type: "none" });
  });
});

describe("distanceKmForSort", () => {
  it("minOf picks closest point", () => {
    const mode = resolveDistanceSortMode({
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [
        { lat: 0, lng: 0 },
        { lat: 10, lng: 10 },
      ],
    });
    const d0 = distanceKmForSort(mode, { lat: 0.01, lng: 0.01 });
    const dFar = distanceKmForSort(mode, { lat: 50, lng: 50 });
    expect(d0).not.toBeNull();
    expect(dFar).not.toBeNull();
    expect((d0 as number) < (dFar as number)).toBe(true);
  });
});
