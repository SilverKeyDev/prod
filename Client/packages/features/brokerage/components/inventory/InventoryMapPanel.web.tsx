import { useCallback, useEffect, useMemo, useRef } from "react";

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
  currentPage: number;
  onSelectListing: (id: string) => void;
  onPageChange: (page: number) => void;
};

const noopSave = async () => {};
const neverSaved = () => false;
const calculatePropertyScore = (property: SearchResult) =>
  typeof property._score === "number" ? property._score : 0;

/**
 * Portfolio map using Search useMapMarkers + MapPropertyCard home cards.
 */
export function InventoryMapPanel({ results, currentPage, onSelectListing, onPageChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, createMap, error } = useGoogleMaps();

  const handleMarkerClick = useCallback(
    (property: SearchResult) => {
      onSelectListing(property.id);
      const index = results.findIndex((r) => r.id === property.id);
      onPageChange(index >= 0 ? index : 0);
    },
    [onSelectListing, onPageChange, results]
  );

  const { updateMapMarkers, clearMapMarkers } = useMapMarkers({
    activeTab: "saved",
    googleMapRef,
    currentPage,
    propertiesPerPage: 1,
    isochroneData: null,
    setIsochroneData: () => {},
    fetchIsochroneForMapOnly: async () => null,
    calculatePropertyScore,
    isHomeSaved: neverSaved,
    saveHome: noopSave,
    removeSavedHome: async () => {},
    onMarkerClick: handleMarkerClick,
    onMapPreviewNavigate: handleMarkerClick,
    contextKey: "inventory-market",
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    mapListingPreviewsEnabled: true,
  });

  const resultsKey = useMemo(
    () => results.map((r) => `${r.id}:${r._score ?? 0}`).join("|"),
    [results]
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
    if (map) googleMapRef.current = map;
  }, [isLoaded, createMap]);

  useEffect(() => {
    const map = googleMapRef.current;
    const win = getWindow() as (Window & { google?: typeof google }) | null;
    if (!map || !isLoaded || !win?.google?.maps) return;

    if (results.length === 0) {
      clearMapMarkers();
      return;
    }

    const bounds = new win.google.maps.LatLngBounds();
    for (const r of results) {
      bounds.extend({ lat: r.lat, lng: r.lng });
    }
    map.fitBounds(bounds, 48);

    void updateMapMarkers(results);
  }, [results, resultsKey, currentPage, isLoaded, updateMapMarkers, clearMapMarkers]);

  if (error) {
    return (
      <Box className="border-border bg-background-surface flex h-full min-h-96 items-center justify-center rounded-xl border">
        <BodyText muted size="sm">
          Map unavailable — listings still shown in the list.
        </BodyText>
      </Box>
    );
  }

  return (
    <Box
      className="border-border relative h-72 w-full overflow-hidden rounded-tl-lg border md:h-full md:min-h-96"
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
