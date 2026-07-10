import { useEffect, useRef, useState } from "react";

import type { IsochroneData } from "packages/features/search/types/isochrone";
import { log } from "packages/logger";
import { useAuthStore, useSearchContextStore } from "packages/store";
import { takePendingPublicSearch } from "packages/utils/growth/agent";

/** Poll cadence / budget for the map instance to come up before searching. */
const MAP_READY_POLL_MS = 250;
const MAP_READY_TIMEOUT_MS = 20_000;

/**
 * Resume a search started in the public agent page bar (SIL-291).
 *
 * The band stashes the picked location in sessionStorage before handing off;
 * this hook consumes it once the viewer is authenticated in the dashboard
 * search — right away for signed-in viewers, or on their first visit to
 * Search after signup/onboarding. It restores the search area + bar text,
 * waits for the map instance to be ready (the location search needs live map
 * bounds), then runs the search as if the user pressed Search.
 */
export function useResumePendingPublicSearch(
  runLocationSearch: () => Promise<void>,
  isMapReady: () => boolean
): void {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLocationPlaceViewportFromBar = useSearchContextStore(
    (s) => s.setLocationPlaceViewportFromBar
  );
  const setLocationBarSeed = useSearchContextStore((s) => s.setLocationBarSeed);

  const consumedRef = useRef(false);
  const [waitingForMap, setWaitingForMap] = useState(false);
  // Latest closures so the deferred run sees the restored store state.
  const runRef = useRef(runLocationSearch);
  runRef.current = runLocationSearch;
  const isMapReadyRef = useRef(isMapReady);
  isMapReadyRef.current = isMapReady;

  useEffect(() => {
    if (consumedRef.current || !authReady || !isAuthenticated) return;
    const pending = takePendingPublicSearch();
    if (!pending) return;
    consumedRef.current = true;

    const hasRing = Array.isArray(pending.ring) && pending.ring.length >= 4;
    if (hasRing && pending.ring) {
      setLocationPlaceViewportFromBar({
        ring: pending.ring,
        label: pending.label,
        overlay: (pending.overlay ?? null) as IsochroneData,
      });
    }
    // No committed area → seed as unselected so the dropdown re-opens on focus.
    setLocationBarSeed({ text: pending.label, selected: hasRing });
    log.info("SEARCH", "Resuming public agent page search", {
      label: pending.label,
      hasRing,
    });
    if (hasRing) {
      setWaitingForMap(true);
    }
  }, [authReady, isAuthenticated, setLocationBarSeed, setLocationPlaceViewportFromBar]);

  // The viewport search bails without a live map (bounds), so poll until the
  // map instance is up, then run — equivalent to the user pressing Search.
  useEffect(() => {
    if (!waitingForMap) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > MAP_READY_TIMEOUT_MS) {
        clearInterval(timer);
        setWaitingForMap(false);
        log.warn("SEARCH", "Map never became ready to resume public agent page search", {});
        return;
      }
      if (!isMapReadyRef.current()) return;
      clearInterval(timer);
      setWaitingForMap(false);
      void runRef.current();
    }, MAP_READY_POLL_MS);
    return () => clearInterval(timer);
  }, [waitingForMap]);
}
