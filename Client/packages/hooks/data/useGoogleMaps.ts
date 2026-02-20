import { useCallback, useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { googleMapsService } from "packages/services/search/googleMaps";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/core/platform";

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: typeof google;
  }
}

export type UseGoogleMapsReturn = {
  isLoaded: boolean;
  error: string | null;
  scriptUrl: string | null;
  createMap: (container: HTMLElement) => unknown;
};

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const createMap = useCallback(
    (container: HTMLElement) => {
      const win = getWindow();
      if (!win) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "Google Maps: window not available (SSR)",
        );
        return null;
      }

      if (!isLoaded || !(win as Window & { google?: typeof google }).google) {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Google Maps not loaded yet");
        return null;
      }

      try {
        return googleMapsService.createMap(container);
      } catch (err: unknown) {
        const error = asError(err);
        log.error(LOG_CATEGORIES.MAP_RENDERING, "Error creating map", error);
        setError(error.message);
        return null;
      }
    },
    [isLoaded],
  );

  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    // Initialize Google Maps regardless of authentication status
    if (!hasInitialized) {
      const initializeGoogleMaps = async () => {
        try {
          await googleMapsService.loadGoogleMapsScript();
          const state = googleMapsService.getState();
          setScriptUrl(state.scriptUrl ?? null);
          setIsLoaded(true);
          setError(null);
          setHasInitialized(true);
        } catch (err: unknown) {
          const error = asError(err);
          log.error(
            LOG_CATEGORIES.MAP_RENDERING,
            "Error loading Google Maps",
            error,
          );
          setError(error.message);
          setIsLoaded(false);
        }
      };

      void initializeGoogleMaps();
    } else if (hasInitialized) {
      // If already initialized, just get the current state
      const state = googleMapsService.getState();
      setScriptUrl(state.scriptUrl ?? null);
      setIsLoaded(state.isLoaded);
      setError(state.error);
    }
  }, [hasInitialized]);

  return {
    isLoaded,
    error,
    scriptUrl,
    createMap,
  };
}
