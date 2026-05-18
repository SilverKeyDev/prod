/**
 * Resolves the Google Cloud Map ID used for vector map styling (web + shared env).
 * Prefers EXPO_PUBLIC_*; accepts legacy VITE_GOOGLE_MAPS_ID during local .env migration.
 */
export function resolveGoogleMapsCloudMapId(
  expoPublicMapId?: string,
  legacyViteMapId?: string
): string | undefined {
  const fromExpo = (expoPublicMapId ?? "").trim();
  if (fromExpo) return fromExpo;
  const fromVite = (legacyViteMapId ?? "").trim();
  return fromVite || undefined;
}
