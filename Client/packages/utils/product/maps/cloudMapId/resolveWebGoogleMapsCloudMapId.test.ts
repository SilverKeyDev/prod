import { describe, expect, it } from "vitest";

import { resolveWebGoogleMapsCloudMapId } from "./resolveWebGoogleMapsCloudMapId";

describe("resolveWebGoogleMapsCloudMapId", () => {
  it("prefers EXPO_PUBLIC_GOOGLE_MAPS_ID over iOS fallback", () => {
    expect(
      resolveWebGoogleMapsCloudMapId({
        fromWeb: "  web-map  ",
        fromIos: "ios-map",
      })
    ).toEqual({ mapId: "web-map", source: "EXPO_PUBLIC_GOOGLE_MAPS_ID" });
  });

  it("falls back to EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS when web id is empty", () => {
    expect(
      resolveWebGoogleMapsCloudMapId({
        fromWeb: "",
        fromIos: "  ios-map  ",
      })
    ).toEqual({ mapId: "ios-map", source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" });
  });

  it("returns none when both ids are blank", () => {
    expect(
      resolveWebGoogleMapsCloudMapId({
        fromWeb: "   ",
        fromIos: "",
      })
    ).toEqual({ mapId: undefined, source: "none" });
  });
});
