import { describe, expect, it } from "vitest";

import { isGooglePlacePreciseStreetAddress } from "./isGooglePlacePreciseStreetAddress";

describe("isGooglePlacePreciseStreetAddress", () => {
  it("returns true when types include street_address", () => {
    expect(
      isGooglePlacePreciseStreetAddress({
        types: ["geocode", "street_address"],
        addressComponents: [],
      })
    ).toBe(true);
  });

  it("returns true when types include premise", () => {
    expect(isGooglePlacePreciseStreetAddress({ types: ["premise"] })).toBe(true);
  });

  it("returns true when types include subpremise", () => {
    expect(isGooglePlacePreciseStreetAddress({ types: ["subpremise", "geocode"] })).toBe(true);
  });

  it("returns true when addressComponents have street_number and route but types are sparse", () => {
    expect(
      isGooglePlacePreciseStreetAddress({
        types: ["geocode"],
        addressComponents: [
          { types: ["street_number"], longText: "27532" },
          { types: ["route"], longText: "Stoney Brook Dr" },
          { types: ["locality"], longText: "Leesburg" },
        ],
      })
    ).toBe(true);
  });

  it("returns false for locality-only (city)", () => {
    expect(
      isGooglePlacePreciseStreetAddress({
        types: ["locality", "geocode", "political"],
        addressComponents: [{ types: ["locality"], longText: "Leesburg" }],
      })
    ).toBe(false);
  });

  it("returns false for postal_code only", () => {
    expect(
      isGooglePlacePreciseStreetAddress({
        types: ["postal_code"],
        addressComponents: [{ types: ["postal_code"], longText: "34748" }],
      })
    ).toBe(false);
  });

  it("returns false when route exists but street_number is missing", () => {
    expect(
      isGooglePlacePreciseStreetAddress({
        types: [],
        addressComponents: [{ types: ["route"], longText: "Main St" }],
      })
    ).toBe(false);
  });
});
