import { describe, expect, it } from "vitest";

import { buildWebGoogleMapOptions } from "packages/features/search/utils/googleMaps/buildWebGoogleMapOptions";

import { resolveGoogleMapsCloudMapId } from "./cloudMapId/resolveGoogleMapsCloudMapId";
import { resolveWebGoogleMapsCloudMapId } from "./cloudMapId/resolveWebGoogleMapsCloudMapId";

/**
 * Simulates Vite process-shim env JSON → map options (no GitHub secrets).
 */
function mapOptionsFromShimEnv(shim: {
  EXPO_PUBLIC_GOOGLE_MAPS_ID?: string;
  EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS?: string;
}): { mapId?: string; source: string } {
  const { mapId, source } = resolveWebGoogleMapsCloudMapId({
    fromWeb: shim.EXPO_PUBLIC_GOOGLE_MAPS_ID ?? "",
    fromIos: shim.EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS ?? "",
  });
  const options = buildWebGoogleMapOptions(mapId);
  return { mapId: options.mapId, source };
}

describe("web maps build pipeline (shim → map options)", () => {
  it("applies mapId when shim has EXPO_PUBLIC_GOOGLE_MAPS_ID", () => {
    expect(
      mapOptionsFromShimEnv({
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "  silverkey-cloud-style  ",
      })
    ).toEqual({
      mapId: "silverkey-cloud-style",
      source: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
    });
  });

  it("falls back to iOS shim key when web id is empty", () => {
    expect(
      mapOptionsFromShimEnv({
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "",
        EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: "ios-cloud-map",
      })
    ).toEqual({
      mapId: "ios-cloud-map",
      source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS",
    });
  });

  it("omits mapId when shim has no map ids", () => {
    const result = mapOptionsFromShimEnv({});
    expect(result.source).toBe("none");
    expect(result.mapId).toBeUndefined();
    expect(resolveGoogleMapsCloudMapId("")).toBeUndefined();
  });
});
