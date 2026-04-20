import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useGoogleMapsStore } from "packages/store";
import { getWindow } from "packages/utils/platform";

type WindowWithGoogle = Window & {
  google?: { maps?: { places?: unknown } };
};

export function useGoogleMapsPlacesReady(): {
  scriptsReady: boolean;
  loadError: string | null;
} {
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isLoaded: googleMapsLoaded, error: googleMapsError } = useGoogleMapsStore();

  useEffect(() => {
    if (googleMapsError) {
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
      return;
    }

    const win = getWindow() as WindowWithGoogle | undefined;
    if (googleMapsLoaded && win?.google?.maps?.places) {
      setScriptsReady(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  return { scriptsReady, loadError };
}
