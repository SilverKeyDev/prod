import { describe, expect, it } from "vitest";

import {
  resolveNativeGoogleMapId,
  shouldUseGoogleMapsOnIos,
} from "./nativeGoogleMapsCloudConfig.logic";

describe("resolveNativeGoogleMapId", () => {
  it("prefers EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS on iOS", () => {
    expect(
      resolveNativeGoogleMapId({
        fromIos: "ios-map",
        fromExpo: "expo-map",
        fromEnv: "env-map",
      })
    ).toEqual({ mapId: "ios-map", source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" });
  });

  it("falls back to EXPO_PUBLIC_GOOGLE_MAPS_ID when iOS id is empty", () => {
    expect(
      resolveNativeGoogleMapId({
        fromIos: "",
        fromExpo: "expo-map",
        fromEnv: "env-map",
      })
    ).toEqual({ mapId: "expo-map", source: "EXPO_PUBLIC_GOOGLE_MAPS_ID" });
  });

  it("falls back to env.googleMapsId when Expo ids are empty", () => {
    expect(
      resolveNativeGoogleMapId({
        fromIos: "",
        fromExpo: "",
        fromEnv: "env-map",
      })
    ).toEqual({ mapId: "env-map", source: "env.googleMapsId" });
  });

  it("returns empty result when no id is configured", () => {
    expect(
      resolveNativeGoogleMapId({
        fromIos: "",
        fromExpo: "",
        fromEnv: "",
      })
    ).toEqual({ mapId: "", source: "" });
  });

  it("trims whitespace from configured ids", () => {
    expect(
      resolveNativeGoogleMapId({
        fromIos: "  ios-map  ",
        fromExpo: "",
        fromEnv: "",
      })
    ).toEqual({ mapId: "ios-map", source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" });
  });
});

describe("shouldUseGoogleMapsOnIos", () => {
  it("uses Google on device (non-simulator)", () => {
    expect(shouldUseGoogleMapsOnIos({ isSimulator: false, forceGoogleInSimulator: false })).toBe(
      true
    );
  });

  it("defaults to Apple Maps on simulator unless forced", () => {
    expect(shouldUseGoogleMapsOnIos({ isSimulator: true, forceGoogleInSimulator: false })).toBe(
      false
    );
  });

  it("uses Google on simulator when EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR is true", () => {
    expect(shouldUseGoogleMapsOnIos({ isSimulator: true, forceGoogleInSimulator: true })).toBe(
      true
    );
  });
});
