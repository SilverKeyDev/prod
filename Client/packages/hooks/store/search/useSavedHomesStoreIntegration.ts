import { useEffect, useRef } from "react";

import { useSavedHomesData } from "packages/hooks/data/search/saved/useSavedHomesData";
import { useSavedHomesStore } from "packages/store";
import { useAuthStore } from "packages/store";

/**
 * Hook that integrates useSavedHomesData with useSavedHomesStore
 * This replaces the SavedHomesContext functionality
 * @param clientId - Optional client ID for agents to view client's saved homes
 */
export function useSavedHomesStoreIntegration(clientId?: string) {
  const _isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _authReady = useAuthStore((s) => s.authReady);

  // Always call useSavedHomesData to maintain hook order consistency
  // The hook itself will handle the authentication requirements via React Query's enabled option
  const savedHomesResult = useSavedHomesData(clientId);

  const {
    savedHomes,
    savedHomesLoading,
    savedHomesError,
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
    isHomeSaved,
  } = savedHomesResult;

  const { setSavedHomes, setSavedHomesLoading, setSavedHomesError } =
    useSavedHomesStore();

  // Sync hook data with store (guard against redundant updates)
  const lastSavedHomesRef = useRef<typeof savedHomes>();
  const lastSavedHomesLoadingRef = useRef<typeof savedHomesLoading>();
  const lastSavedHomesErrorRef = useRef<typeof savedHomesError>();

  // Sync hook data with store
  useEffect(() => {
    if (lastSavedHomesRef.current !== savedHomes) {
      lastSavedHomesRef.current = savedHomes;
      setSavedHomes(savedHomes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedHomes]); // Zustand setters are stable

  useEffect(() => {
    if (lastSavedHomesLoadingRef.current !== savedHomesLoading) {
      lastSavedHomesLoadingRef.current = savedHomesLoading;
      setSavedHomesLoading(savedHomesLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedHomesLoading]); // Zustand setters are stable

  useEffect(() => {
    if (lastSavedHomesErrorRef.current !== savedHomesError) {
      lastSavedHomesErrorRef.current = savedHomesError;
      setSavedHomesError(savedHomesError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedHomesError]); // Zustand setters are stable

  // Override the store's placeholder methods with real implementations
  useEffect(() => {
    const store = useSavedHomesStore.getState();
    // Replace the placeholder methods with real implementations
    store.refreshSavedHomes = async () => {
      await refreshSavedHomes();
    };
    store.saveHome = saveHome;
    store.removeSavedHomeAsync = removeSavedHome;
  }, [refreshSavedHomes, saveHome, removeSavedHome]);

  return {
    savedHomes,
    savedHomesLoading,
    savedHomesError,
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
    isHomeSaved,
  };
}
