import * as Device from "expo-device";
import { Platform } from "react-native";

import { env, getEnv } from "packages/config";
import { log } from "packages/logger";

import {
  resolveNativeGoogleMapId,
  shouldUseGoogleMapsOnIos,
} from "./nativeGoogleMapsCloudConfig.logic";

/**
 * Google Cloud Map ID for react-native-maps (Google provider). Shared by search and property-details maps.
 */
export function getGoogleMapIdForNative(): string {
  const envCfg = getEnv();
  const isIOS = Platform.OS.toLowerCase().startsWith("ios");
  const fromIos = isIOS ? String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS") ?? "") : "";
  const fromExpo = String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID") ?? "");
  const fromEnv = env.googleMapsId ?? "";
  const { mapId, source } = resolveNativeGoogleMapId({ fromIos, fromExpo, fromEnv });

  if (!mapId) {
    log.warn(
      "MAP_RENDERING",
      "Google Cloud Map ID not set (EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS on iOS, or EXPO_PUBLIC_GOOGLE_MAPS_ID) - map will use default styling"
    );
    return mapId;
  }

  log.info("MAP_RENDERING", "Native map ID resolved for Cloud styling", {
    mapId,
    source,
    platform: Platform.OS,
  });

  return mapId;
}

/**
 * Prefer Google Maps when configured. On Android always Google. On iOS: Google on device;
 * Simulator defaults to Apple Maps unless EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR=true.
 */
export function getUseGoogleMapsProvider(): boolean {
  const isIOS = Platform.OS.toLowerCase().startsWith("ios");
  if (!isIOS) return true;
  // `Constants.isDevice` was removed in expo-constants 17 (SDK 52); it read as `undefined`, so
  // `undefined === false` made every simulator look like a real device. That selected the Google
  // provider, and GMSServices aborts the process when no Maps SDK key is configured
  // (+[GMSServices checkServicePreconditions] -> SIGABRT). expo-device is the current API.
  const isSimulator = Device.isDevice === false;
  const envCfg = getEnv();
  const forceGoogleInSimulator =
    String(envCfg.getRaw("EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR") ?? "").trim() === "true";
  return shouldUseGoogleMapsOnIos({ isSimulator, forceGoogleInSimulator });
}
