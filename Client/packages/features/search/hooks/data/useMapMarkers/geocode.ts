import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const win = getWindow();
  if (!address || !win) return null;
  const Geocoder = win.google?.maps?.Geocoder;
  if (!Geocoder) return null;
  try {
    const geocoderInstance = new Geocoder();
    const response = await geocoderInstance.geocode({ address });
    const results = response?.results;
    if (results && results.length > 0) {
      const location = results[0].geometry?.location;
      if (location) {
        return { lat: location.lat(), lng: location.lng() };
      }
    }
  } catch (error) {
    log.error(LOG_CATEGORIES.MAP_RENDERING, "Geocoding failed for address", {
      address,
      error,
    });
  }
  return null;
}
