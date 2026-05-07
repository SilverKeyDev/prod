import { describe, expect, it } from "vitest";

import {
  isSupportedServiceAreaAddressComponents,
  isSupportedServiceAreaCoordinates,
  SUPPORTED_SERVICE_AREA_STATE_SHORT,
  SUPPORTED_SERVICE_AREA_WARNING,
} from "./serviceAreaAvailability";

describe("serviceAreaAvailability", () => {
  it("accepts Google address components in Georgia", () => {
    expect(
      isSupportedServiceAreaAddressComponents([
        { types: ["locality"], longText: "Atlanta" },
        {
          types: ["administrative_area_level_1"],
          longText: "Georgia",
          shortText: SUPPORTED_SERVICE_AREA_STATE_SHORT,
        },
      ]),
    ).toBe(true);
  });

  it("rejects Google address components outside Georgia", () => {
    expect(
      isSupportedServiceAreaAddressComponents([
        { types: ["locality"], longText: "New York" },
        {
          types: ["administrative_area_level_1"],
          longText: "New York",
          shortText: "NY",
        },
      ]),
    ).toBe(false);
  });

  it("rejects Google address components without a state", () => {
    expect(
      isSupportedServiceAreaAddressComponents([
        { types: ["country"], longText: "United States" },
      ]),
    ).toBe(false);
  });

  it("accepts coordinates inside the temporary Georgia bounding box", () => {
    expect(
      isSupportedServiceAreaCoordinates({ lat: 33.749, lng: -84.388 }),
    ).toBe(true);
  });

  it("rejects coordinates outside the temporary Georgia bounding box", () => {
    expect(
      isSupportedServiceAreaCoordinates({ lat: 40.7128, lng: -74.006 }),
    ).toBe(false);
  });

  it("exposes warning copy for blocked locations", () => {
    expect(SUPPORTED_SERVICE_AREA_WARNING).toBe(
      "SilverKey is only available in Georgia areas right now.",
    );
  });
});
