import type { ViewingStop } from "packages/api/viewings";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";

export type { ViewingStop };

export async function geocodeViewingStopsIfNeeded(stops: ViewingStop[]): Promise<ViewingStop[]> {
  const win = getWindow() as Window & { google?: { maps: typeof google.maps } };
  if (!win.google?.maps?.Geocoder) {
    return stops;
  }
  const geocoder = new win.google.maps.Geocoder();
  const out: ViewingStop[] = [];

  for (const s of stops) {
    if (s.lat != null && s.lng != null) {
      out.push(s);
      continue;
    }
    const addr = s.address?.trim();
    if (!addr) {
      continue;
    }
    try {
      const { results } = await geocoder.geocode({ address: addr });
      const loc = results[0]?.geometry?.location;
      if (!loc) {
        out.push(s);
        continue;
      }
      out.push({ ...s, lat: loc.lat(), lng: loc.lng() });
    } catch (e) {
      log.warn(LOG_CATEGORIES.HTTP, "Geocode failed for viewing stop", e);
      out.push(s);
    }
  }

  return out;
}
