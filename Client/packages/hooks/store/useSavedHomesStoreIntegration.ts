import { useEffect, useRef } from "react";

import { useSavedHomesStore } from "../../store/savedHomes.slice";
import { useSavedHomesData } from "../data/useSavedHomesData";

/**
 * Hook that integrates useSavedHomesData with useSavedHomesStore
 * This replaces the SavedHomesContext functionality
 */
export function useSavedHomesStoreIntegration() {
  const {
    savedHomes,
    savedHomesLoading,
    savedHomesError,
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
  } = useSavedHomesData();

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
  }, [savedHomes, setSavedHomes]);

  useEffect(() => {
    if (lastSavedHomesLoadingRef.current !== savedHomesLoading) {
      lastSavedHomesLoadingRef.current = savedHomesLoading;
      setSavedHomesLoading(savedHomesLoading);
    }
  }, [savedHomesLoading, setSavedHomesLoading]);

  useEffect(() => {
    if (lastSavedHomesErrorRef.current !== savedHomesError) {
      lastSavedHomesErrorRef.current = savedHomesError;
      setSavedHomesError(savedHomesError);
    }
  }, [savedHomesError, setSavedHomesError]);

  return {
    savedHomes,
    savedHomesLoading,
    savedHomesError,
    refreshSavedHomes,
    saveHome,
    removeSavedHome,
  };
}
