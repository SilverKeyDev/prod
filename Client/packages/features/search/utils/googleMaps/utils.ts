import { getWindow } from "packages/utils/platform";

/**
 * Pure helpers for Google Maps readiness check
 */
export function isGoogleMapsReady(): boolean {
  const win = getWindow() as Window & { google?: typeof google };
  return (
    !!win &&
    !!win.google?.maps?.Map &&
    !!win.google?.maps?.ControlPosition &&
    typeof win.google?.maps?.MapTypeControlStyle !== "undefined" &&
    typeof win.google?.maps?.Geocoder !== "undefined"
  );
}
