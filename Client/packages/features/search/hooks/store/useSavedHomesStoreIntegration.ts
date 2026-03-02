import { useEffect, useRef } from "react";

import { useSavedHomesStore } from "packages/store";
import { useAuthStore } from "packages/store";

import { useSavedHomesData } from "@/features/search/hooks/data/saved/useSavedHomesData";

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

  const {
    setSavedHomes,
    setSavedHomesLoading,
    setSavedHomesError,
    setRefreshSavedHomesImpl,
    setSaveHomeImpl,
    setRemoveSavedHomeAsyncImpl,
  } = useSavedHomesStore();

  // Refs to hold latest callbacks so we only inject impls once (avoids infinite loop from
  // effect -> setState(store) -> re-render -> new callback refs -> effect)
  const refreshSavedHomesRef = useRef(refreshSavedHomes);
  const saveHomeRef = useRef(saveHome);
  const removeSavedHomeRef = useRef(removeSavedHome);
  refreshSavedHomesRef.current = refreshSavedHomes;
  saveHomeRef.current = saveHome;
  removeSavedHomeRef.current = removeSavedHome;

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

  // Inject store impls once on mount. Store methods call through refs so they always use
  // the latest callbacks without re-running this effect (prevents maximum update depth).
  useEffect(() => {
    setRefreshSavedHomesImpl(async () => {
      await refreshSavedHomesRef.current();
    });
    setSaveHomeImpl((property: Parameters<typeof saveHome>[0]) => saveHomeRef.current(property));
    setRemoveSavedHomeAsyncImpl((propertyId: string) => removeSavedHomeRef.current(propertyId));
    // Intentionally empty: run once; refs hold latest callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
