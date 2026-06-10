import { describe, expect, it, vi } from "vitest";

import {
  parseAddressComponentsFromGooglePlace,
  placeFromAutocompleteSuggestion,
  resolveGooglePlaceToAddressData,
} from "./resolveGooglePlaceToAddressData";

describe("parseAddressComponentsFromGooglePlace", () => {
  it("parses street, city, state, postal_code, and country from components", () => {
    const parsed = parseAddressComponentsFromGooglePlace(
      [
        { longText: "123", types: ["street_number"] },
        { longText: "Main St", types: ["route"] },
        { longText: "San Francisco", types: ["locality"] },
        { shortText: "CA", types: ["administrative_area_level_1"] },
        { longText: "94102", types: ["postal_code"] },
        { longText: "United States", types: ["country"] },
      ],
      "123 Main St, San Francisco, CA 94102"
    );
    expect(parsed).toEqual({
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postal_code: "94102",
      country: "United States",
    });
  });
});

describe("placeFromAutocompleteSuggestion", () => {
  it("calls toPlace on placePrediction", () => {
    const place = { id: "place-1" };
    const toPlace = vi.fn(() => place);
    const suggestion = { placePrediction: { toPlace } };
    expect(placeFromAutocompleteSuggestion(suggestion)).toBe(place);
    expect(toPlace).toHaveBeenCalledTimes(1);
  });
});

describe("resolveGooglePlaceToAddressData", () => {
  it("returns fallback address when place cannot fetch fields", async () => {
    const result = await resolveGooglePlaceToAddressData(null, "  typed address  ");
    expect(result).toEqual({ address: "typed address" });
  });

  it("returns structured AddressData after fetchFields", async () => {
    const place = {
      fetchFields: vi.fn().mockResolvedValue(undefined),
      formattedAddress: "123 Main St, San Francisco, CA 94102, USA",
      id: "places/ChIJxyz",
      addressComponents: [
        { longText: "123", types: ["street_number"] },
        { longText: "Main St", types: ["route"] },
        { longText: "San Francisco", types: ["locality"] },
        { shortText: "CA", types: ["administrative_area_level_1"] },
        { longText: "94102", types: ["postal_code"] },
        { longText: "United States", types: ["country"] },
      ],
      location: {
        lat: () => 37.77,
        lng: () => -122.42,
      },
    };

    const result = await resolveGooglePlaceToAddressData(place, "partial");
    expect(result).toMatchObject({
      address: "123 Main St, San Francisco, CA 94102, USA",
      place_id: "places/ChIJxyz",
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postal_code: "94102",
      country: "United States",
      lat: 37.77,
      lng: -122.42,
    });
    expect(place.fetchFields).toHaveBeenCalledWith({
      fields: ["formattedAddress", "addressComponents", "id", "location"],
    });
  });
});
