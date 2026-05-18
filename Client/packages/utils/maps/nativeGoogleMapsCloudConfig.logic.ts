export type ResolveNativeGoogleMapIdInput = {
  fromIos: string;
  fromExpo: string;
  fromEnv: string;
};

export type ResolveNativeGoogleMapIdResult = {
  mapId: string;
  source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" | "EXPO_PUBLIC_GOOGLE_MAPS_ID" | "env.googleMapsId" | "";
};

/**
 * Resolves Google Cloud Map ID for native maps (iOS-specific id wins, then Expo, then env getter).
 */
export function resolveNativeGoogleMapId({
  fromIos,
  fromExpo,
  fromEnv,
}: ResolveNativeGoogleMapIdInput): ResolveNativeGoogleMapIdResult {
  const ios = fromIos.trim();
  const expo = fromExpo.trim();
  const envId = fromEnv.trim();
  const mapId = ios || expo || envId;

  if (!mapId) {
    return { mapId: "", source: "" };
  }

  if (ios) {
    return { mapId, source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" };
  }
  if (expo) {
    return { mapId, source: "EXPO_PUBLIC_GOOGLE_MAPS_ID" };
  }
  return { mapId, source: "env.googleMapsId" };
}

export type ShouldUseGoogleMapsOnIosInput = {
  isSimulator: boolean;
  forceGoogleInSimulator: boolean;
};

/**
 * On iOS simulator, Apple Maps is default unless EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR=true.
 */
export function shouldUseGoogleMapsOnIos({
  isSimulator,
  forceGoogleInSimulator,
}: ShouldUseGoogleMapsOnIosInput): boolean {
  return !isSimulator || forceGoogleInSimulator;
}
