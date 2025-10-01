import { useEffect, useRef } from "react";
import { useGoogleMapsStore } from "../../store/googleMaps.slice";
import { useGoogleMaps } from "../data/useGoogleMaps";

/**
 * Hook that integrates useGoogleMaps with useGoogleMapsStore
 * This replaces the GoogleMapsProvider functionality
 */
export function useGoogleMapsStoreIntegration() {
  const {
    isLoaded: dataIsLoaded,
    error: dataError,
    scriptUrl: dataScriptUrl,
  } = useGoogleMaps();

  const {
    isLoaded,
    isLoading,
    error,
    scriptUrl,
    setLoaded,
    setLoading,
    setError,
    setScriptUrl,
    loadGoogleMaps,
    createMap: storeCreateMap,
    getServiceState,
  } = useGoogleMapsStore();

  // Sync data hook with store (guard against redundant updates)
  const lastDataIsLoadedRef = useRef<typeof dataIsLoaded>();
  const lastDataErrorRef = useRef<typeof dataError>();
  const lastDataScriptUrlRef = useRef<typeof dataScriptUrl>();

  useEffect(() => {
    if (lastDataIsLoadedRef.current !== dataIsLoaded) {
      lastDataIsLoadedRef.current = dataIsLoaded;
      setLoaded(dataIsLoaded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataIsLoaded]); // Zustand setters are stable

  useEffect(() => {
    if (lastDataErrorRef.current !== dataError) {
      lastDataErrorRef.current = dataError;
      setError(dataError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataError]); // Zustand setters are stable

  useEffect(() => {
    if (lastDataScriptUrlRef.current !== dataScriptUrl) {
      lastDataScriptUrlRef.current = dataScriptUrl;
      setScriptUrl(dataScriptUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataScriptUrl]); // Zustand setters are stable

  // Expose the combined state and actions
  return {
    // State from store (synced with data hook)
    isLoaded,
    isLoading,
    error,
    scriptUrl,

    // Actions
    setLoaded,
    setLoading,
    setError,
    setScriptUrl,
    loadGoogleMaps,
    createMap: storeCreateMap,
    getServiceState,
  };
}
