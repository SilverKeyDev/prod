import { resolveGoogleMapsCloudMapId } from "./resolveGoogleMapsCloudMapId";

export type WebGoogleMapsCloudMapIdSource =
  | "EXPO_PUBLIC_GOOGLE_MAPS_ID"
  | "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS"
  | "none";

export type ResolveWebGoogleMapsCloudMapIdInput = {
  fromWeb: string;
  fromIos: string;
};

export type ResolveWebGoogleMapsCloudMapIdResult = {
  mapId: string | undefined;
  source: WebGoogleMapsCloudMapIdSource;
};

/**
 * Resolves Cloud Map ID for web (web env wins, then iOS fallback — matches packages/config/env.ts).
 */
export function resolveWebGoogleMapsCloudMapId({
  fromWeb,
  fromIos,
}: ResolveWebGoogleMapsCloudMapIdInput): ResolveWebGoogleMapsCloudMapIdResult {
  const webId = resolveGoogleMapsCloudMapId(fromWeb);
  if (webId) {
    return { mapId: webId, source: "EXPO_PUBLIC_GOOGLE_MAPS_ID" };
  }
  const iosId = resolveGoogleMapsCloudMapId(fromIos);
  if (iosId) {
    return { mapId: iosId, source: "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS" };
  }
  return { mapId: undefined, source: "none" };
}
