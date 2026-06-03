import { useCallback, useEffect, useState } from "react";

import { log } from "packages/logger";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/platform";

import { googleMapsService } from "@/features/search/utils/googleMaps";

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
  createMap: (container: HTMLElement, overrides?: Partial<google.maps.MapOptions>) => unknown;
};

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const createMap = useCallback(
    (container: HTMLElement, overrides?: Partial<google.maps.MapOptions>) => {
      const win = getWindow();
      if (!win) {
        log.warn("MAP_RENDERING", "Google Maps: window not available (SSR)");
        return null;
      }

      if (!isLoaded || !(win as Window & { google?: typeof google }).google) {
        log.warn("MAP_RENDERING", "Google Maps not loaded yet");
        return null;
      }

      try {
        return googleMapsService.createMap(container, overrides);
      } catch (err: unknown) {
        const error = asError(err);
        log.error("MAP_RENDERING", "Error creating map", error);
        setError(error.message);
        return null;
      }
    },
    [isLoaded]
  );

  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    // Initialize Google Maps regardless of authentication status
    if (!hasInitialized) {
      const initializeGoogleMaps = async () => {
        try {
          await googleMapsService.loadGoogleMapsScript();
          const state = googleMapsService.getLoaderState();
          setScriptUrl(state.scriptUrl ?? null);
          setIsLoaded(true);
          setError(null);
          setHasInitialized(true);
        } catch (err: unknown) {
          const error = asError(err);
          log.error("MAP_RENDERING", "Error loading Google Maps", error);
          setError(error.message);
          setIsLoaded(false);
        }
      };

      void initializeGoogleMaps();
    } else if (hasInitialized) {
      // If already initialized, just get the current state
      const state = googleMapsService.getLoaderState();
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
