import { useEffect, useMemo, useRef } from "react";

import {
  cleanupMapPropertyCard,
  renderMapPropertyCard,
} from "packages/features/search/components/cards/MapPropertyCardUtils";
import { useMapMarkers } from "packages/features/search/hooks/data/useMapMarkers";
import type { SearchResult } from "packages/features/search/types";
import { useGoogleMaps } from "packages/hooks/data";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { getWindow } from "packages/utils/core/platform";

type Props = {
  results: SearchResult[];
  /** Remount key when pin color mode changes. */
  colorMode?: string;
};

/** Stable noops — inventory map never shows save hearts or listing cards. */
const noopSave = async () => {};
const neverSaved = () => false;
const noopRemove = async () => {};
const noopSetIsochrone = () => {};
const noopFetchIsochrone = async () => null;
const noopMarkerClick = () => {};
const calculatePropertyScore = (property: SearchResult) =>
  typeof property._score === "number" ? property._score : 0;

function triggerMapResize(map: google.maps.Map, win: Window & { google?: typeof google }) {
  const maps = win.google?.maps;
  if (!maps?.event) return;
  maps.event.trigger(map, "resize");
}

/**
 * Portfolio map — pins only (no floating home cards / hearts).
 */
export function InventoryMapPanel({ results, colorMode = "status" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const fittedResultsKeyRef = useRef<string | null>(null);
  const { isLoaded, createMap, error } = useGoogleMaps();

  const { updateMapMarkers, clearMapMarkers } = useMapMarkers({
    activeTab: "saved",
    googleMapRef,
    currentPage: 0,
    propertiesPerPage: 1,
    isochroneData: null,
    setIsochroneData: noopSetIsochrone,
    fetchIsochroneForMapOnly: noopFetchIsochrone,
    calculatePropertyScore,
    isHomeSaved: neverSaved,
    saveHome: noopSave,
    removeSavedHome: noopRemove,
    onMarkerClick: noopMarkerClick,
    onMapPreviewNavigate: noopMarkerClick,
    contextKey: `inventory-market-${colorMode}`,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    mapListingPreviewsEnabled: false,
  });

  const updateMapMarkersRef = useRef(updateMapMarkers);
  updateMapMarkersRef.current = updateMapMarkers;
  const clearMapMarkersRef = useRef(clearMapMarkers);
  clearMapMarkersRef.current = clearMapMarkers;

  const resultsKey = useMemo(
    () => `${colorMode}|${results.map((r) => `${r.id}:${r.lat}:${r.lng}:${r._score}`).join("|")}`,
    [results, colorMode]
  );

  useEffect(() => {
    if (!isLoaded || !containerRef.current || googleMapRef.current) return;
    const map = createMap(containerRef.current, {
      center: { lat: 33.78, lng: -84.4 },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    }) as google.maps.Map | null;
    if (map) {
      googleMapRef.current = map;
      const win = getWindow() as (Window & { google?: typeof google }) | null;
      if (win) triggerMapResize(map, win);
    }
  }, [isLoaded, createMap]);

  useEffect(() => {
    const map = googleMapRef.current;
    const win = getWindow() as (Window & { google?: typeof google }) | null;
    if (!map || !isLoaded || !win?.google?.maps) return;

    if (results.length === 0) {
      clearMapMarkersRef.current();
      fittedResultsKeyRef.current = resultsKey;
      return;
    }

    if (fittedResultsKeyRef.current !== resultsKey) {
      const bounds = new win.google.maps.LatLngBounds();
      for (const r of results) {
        bounds.extend({ lat: r.lat, lng: r.lng });
      }
      map.fitBounds(bounds, 48);
      fittedResultsKeyRef.current = resultsKey;
      triggerMapResize(map, win);
    }

    void updateMapMarkersRef.current(results);
  }, [results, resultsKey, isLoaded]);

  if (error) {
    return (
      <Box className="border-border bg-background-surface flex h-96 min-h-96 items-center justify-center rounded-xl border">
        <BodyText muted size="sm">
          Map unavailable. Check your connection or try again later.
        </BodyText>
      </Box>
    );
  }

  return (
    <Box
      className="border-border relative h-96 w-full overflow-hidden rounded-xl border"
      data-testid="inventory-map"
    >
      {!isLoaded ? (
        <Box className="bg-background-surface absolute inset-0 flex items-center justify-center">
          <BodyText muted size="sm">
            Loading map…
          </BodyText>
        </Box>
      ) : null}
      <Box ref={containerRef} className="h-full w-full" />
    </Box>
  );
}
