import type { QueryClient } from "@tanstack/react-query";

import { getEnv, userApi } from "packages/config";
import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SavedHome } from "packages/types";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";
import { getWindow } from "packages/utils/platform";
import type { RawHomeData } from "packages/utils/saved";
import { mapSavedHomeWireToSavedHome } from "packages/utils/saved";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

interface WindowWithGoogle {
  google?: {
    maps?: {
      Geocoder?: new () => {
        geocode: (req: { address: string }) => Promise<{
          results?: Array<{
            geometry?: {
              location?: {
                lat: number | (() => number);
                lng: number | (() => number);
              };
            };
          }>;
        }>;
      };
    };
  };
}

function hasValidSavedHomeCoordinates(home: RawHomeData): boolean {
  const existingLat = home?.lat ?? home?.latitude;
  const existingLng = home?.lng ?? home?.longitude ?? home?.lon;
  const latNum = typeof existingLat === "number" ? existingLat : Number(existingLat);
  const lngNum = typeof existingLng === "number" ? existingLng : Number(existingLng);
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180 &&
    !(latNum === 0 && lngNum === 0)
  );
}

async function enrichRawHomeWithCoordinatesIfNeeded(
  home: RawHomeData,
  index: number
): Promise<RawHomeData> {
  const existingLat = home?.lat ?? home?.latitude;
  const existingLng = home?.lng ?? home?.longitude ?? home?.lon;

  if (hasValidSavedHomeCoordinates(home)) {
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "\u{1F5FA}\uFE0F [SAVED HOMES] Using existing valid coordinates for saved home",
      {
        index,
        address: home.address,
        lat: existingLat,
        lng: existingLng,
      }
    );
    return home;
  }

  try {
    const win = getWindow() as unknown as WindowWithGoogle | null;
    if (win?.google?.maps?.Geocoder && home?.address) {
      const geocoder = new win.google.maps.Geocoder();
      const result = await geocoder.geocode({ address: home.address });
      const location = result?.results?.[0]?.geometry?.location;
      if (location) {
        const lat = typeof location.lat === "function" ? location.lat() : location.lat;
        const lng = typeof location.lng === "function" ? location.lng() : location.lng;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          log.debug(
            LOG_CATEGORIES.MAP_RENDERING,
            "\u{1F5FA}\uFE0F [SAVED HOMES] Geocoded coordinates for saved home",
            {
              address: home.address,
              lat,
              lng,
            }
          );
          return { ...home, lat, lng };
        }
      }
    }
  } catch {
    // Silent fallback
  }

  return home;
}

function logLoadedFavoriteHomesSample(rawHomes: RawHomeData[]): void {
  const isDev = getEnv().isDevelopment;
  log.info(
    LOG_CATEGORIES.MAP_RENDERING,
    "\u{1F5FA}\uFE0F [SAVED HOMES] Loaded raw favorite homes from API",
    {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      rawCount: rawHomes.length,
      sample: rawHomes.slice(0, 3).map((home, i) => ({
        index: i,
        id: home.id,
        address: home.address,
        lat: home.lat ?? home.latitude,
        lng: home.lng ?? home.longitude ?? home.lon,
      })),
    }
  );
}

export async function fetchFavoriteHomesData(
  queryClient: QueryClient,
  clientId: string | undefined
): Promise<SavedHome[]> {
  const cached = queryClient.getQueryData<SavedHome[]>(queryKeys.homes.favorites(clientId));
  if (cached && Array.isArray(cached) && cached.length > 0) {
    const isProcessed = cached.every(
      (home) => home && typeof home === "object" && "home_id" in home && "address" in home
    );
    if (isProcessed) {
      return cached;
    }
  }

  const sess = getSessionStorage();
  if (!sess.getItem("saved_homes_fetch_logged")) {
    sess.setItem("saved_homes_fetch_logged", "true");
  }

  const response = await userApi.getFavoriteHomes(clientId);
  if (!response.success) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to load favorite homes"));
  }

  const rawHomes = (response.favorites ?? []) as unknown as RawHomeData[];
  logLoadedFavoriteHomesSample(rawHomes);

  if (!sess.getItem("saved_homes_loaded_logged")) {
    sess.setItem("saved_homes_loaded_logged", "true");
  }

  const enriched = await Promise.all(
    rawHomes.map((home, index) => enrichRawHomeWithCoordinatesIfNeeded(home, index))
  );

  return enriched.map((home, index) => mapSavedHomeWireToSavedHome(home, index));
}
