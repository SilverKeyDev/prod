/**
 * Resolves the Google Cloud Map ID used for vector map styling (web + shared env).
 */
export function resolveGoogleMapsCloudMapId(expoPublicMapId?: string): string | undefined {
  const id = (expoPublicMapId ?? "").trim();
  return id || undefined;
}
