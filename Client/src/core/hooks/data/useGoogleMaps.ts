import { useState, useEffect, useCallback } from 'react';

import { useAuthStore } from '../../store/auth.slice';
import { googleMapsService } from '../../services/googleMaps';
import { asError } from '../../utils/error';

// Global type declaration for Google Maps
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
  
  const authStatus = useAuthStore((s) => s.authStatus);

  const createMap = useCallback(
    (container: HTMLElement) => {
      // SSR-safe guard
      if (typeof window === 'undefined') {
        console.warn('Google Maps: window not available (SSR)');
        return null;
      }

      if (!isLoaded || !window.google) {
        console.warn('Google Maps not loaded yet');
        return null;
      }

      try {
        return googleMapsService.createMap(container);
      } catch (err: unknown) {
        const error = asError(err);
        console.error('Error creating map:', error);
        setError(error.message);
        return null;
      }
    },
    [isLoaded]
  );

  useEffect(() => {
    // SSR-safe guard
    if (typeof window === 'undefined') {
      return;
    }

    // Only initialize once after user is authenticated
    if (authStatus === 'authenticated' && !hasInitialized) {
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
          console.error('Error loading Google Maps:', error);
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
  }, [authStatus, hasInitialized]);

  return {
    isLoaded,
    error,
    scriptUrl,
    createMap,
  };
}
