import { describe, expect, it } from "vitest";

import { getListingCoords, getListingCoordsUnavailableDiagnostics } from "./listingCoords";

describe("getListingCoords", () => {
  it("returns coords from numeric lat/lng", () => {
    expect(getListingCoords({ lat: 33.75, lng: -84.39 })).toEqual({
      lat: 33.75,
      lng: -84.39,
    });
  });

  it("returns coords from numeric latitude/longitude", () => {
    expect(getListingCoords({ latitude: 40.7, longitude: -74 })).toEqual({
      lat: 40.7,
      lng: -74,
    });
  });

  it("returns coords from nested location (OpenAPI-style)", () => {
    expect(
      getListingCoords({
        location: {
          address: "1 Main",
          city: "X",
          state: "GA",
          zipcode: "31324",
          latitude: 31.2,
          longitude: -81.5,
        },
      })
    ).toEqual({ lat: 31.2, lng: -81.5 });
  });

  it("returns coords from nested coordinates (Slipstream-style)", () => {
    expect(
      getListingCoords({
        address: "123 St",
        coordinates: { latitude: 33.9, longitude: -84.3 },
      })
    ).toEqual({ lat: 33.9, lng: -84.3 });
  });

  it("prefers top-level lat/lng over nested location when coordinates absent", () => {
    expect(
      getListingCoords({
        lat: 1,
        lng: 2,
        location: { latitude: 9, longitude: 9 },
      })
    ).toEqual({ lat: 1, lng: 2 });
  });

  it("prefers nested coordinates over top-level placeholder zeros", () => {
    expect(
      getListingCoords({
        lat: 0,
        lng: 0,
        latitude: 0,
        longitude: 0,
        coordinates: { latitude: 31.925067, longitude: -81.284992 },
      })
    ).toEqual({ lat: 31.925067, lng: -81.284992 });
  });

  it("prefers nested coordinates over top-level when both are non-zero", () => {
    expect(
      getListingCoords({
        lat: 1,
        lng: 2,
        coordinates: { latitude: 31.9, longitude: -81.3 },
      })
    ).toEqual({ lat: 31.9, lng: -81.3 });
  });

  it("parses string latitude/longitude from API payloads", () => {
    expect(getListingCoords({ latitude: "33.749", longitude: "-84.388" })).toEqual({
      lat: 33.749,
      lng: -84.388,
    });
  });

  it("prefers lat over latitude when both are valid", () => {
    expect(getListingCoords({ lat: 1, latitude: 2, lng: 3, longitude: 4 })).toEqual({
      lat: 1,
      lng: 3,
    });
  });

  it("returns null for placeholder 0,0", () => {
    expect(getListingCoords({ lat: 0, lng: 0 })).toBeNull();
  });

  it("ignores zero lat/lng placeholders and uses latitude/longitude from basic stream", () => {
    expect(
      getListingCoords({
        lat: 0,
        lng: 0,
        latitude: 31.95,
        longitude: -81.15,
      })
    ).toEqual({ lat: 31.95, lng: -81.15 });
  });

  it("ignores zero placeholders and uses nested location", () => {
    expect(
      getListingCoords({
        lat: 0,
        lng: 0,
        location: { latitude: 31.2, longitude: -81.5 },
      })
    ).toEqual({ lat: 31.2, lng: -81.5 });
  });

  it("returns null when coordinates are missing or invalid", () => {
    expect(getListingCoords({})).toBeNull();
    expect(getListingCoords({ latitude: "nope", longitude: 1 })).toBeNull();
  });
});

describe("getListingCoordsUnavailableDiagnostics", () => {
  it("returns null when coords are available", () => {
    expect(getListingCoordsUnavailableDiagnostics({ lat: 1, lng: 2 })).toBeNull();
  });

  it("reports missing coords when only zero placeholders are set", () => {
    expect(getListingCoordsUnavailableDiagnostics({ lat: 0, lng: 0 })).toMatchObject({
      reason: "missing_or_invalid_lat_and_lng",
      parsedLatFinite: false,
      parsedLngFinite: false,
      resolutionNote: "lat_lng_zero_no_latitude_longitude_fallback",
    });
  });

  it("reports when all four top-level coords are zero (NaN in JSON becomes null)", () => {
    expect(
      getListingCoordsUnavailableDiagnostics({
        lat: 0,
        lng: 0,
        latitude: 0,
        longitude: 0,
      })
    ).toMatchObject({
      reason: "missing_or_invalid_lat_and_lng",
      parsedLatFinite: false,
      parsedLngFinite: false,
      resolutionNote:
        "all_top_level_lat_lng_latitude_longitude_are_zero_skipped_need_nested_location_or_stream_basic",
    });
  });

  it("reports both axes invalid", () => {
    const d = getListingCoordsUnavailableDiagnostics({});
    expect(d?.reason).toBe("missing_or_invalid_lat_and_lng");
    expect(d?.parsedLatFinite).toBe(false);
    expect(d?.parsedLngFinite).toBe(false);
    expect(d?.fields).toEqual({
      lat: "undefined",
      latitude: "undefined",
      lng: "undefined",
      longitude: "undefined",
    });
  });

  it("reports invalid lat only", () => {
    expect(getListingCoordsUnavailableDiagnostics({ latitude: "nope", longitude: 1 })?.reason).toBe(
      "missing_or_invalid_lat"
    );
  });

  it("reports invalid lng only", () => {
    expect(getListingCoordsUnavailableDiagnostics({ lat: 1, lng: "x" })?.reason).toBe(
      "missing_or_invalid_lng"
    );
  });
});
