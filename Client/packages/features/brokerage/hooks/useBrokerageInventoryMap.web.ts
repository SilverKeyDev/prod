import { useEffect, useRef } from "react";

import { useGoogleMaps } from "packages/features/search/hooks/data/map/useGoogleMaps";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { googleMapsService } from "packages/features/search/utils/googleMaps";

type MarkerLike = {
  map: google.maps.Map | null;
  addListener?: (event: string, handler: () => void) => void;
};

export function useBrokerageInventoryMap(
  listings: SearchResult[],
  selectedId: string | null,
  onSelectListing: (listingId: string) => void
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MarkerLike[]>([]);
  const { isLoaded, error, createMap } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || listings.length === 0) {
      return;
    }

    const map = createMap(mapRef.current) as google.maps.Map | null;
    if (!map) {
      return;
    }

    mapInstanceRef.current = map;
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;

    listings.forEach((listing) => {
      bounds.extend({ lat: listing.lat, lng: listing.lng });

      if (!AdvancedMarkerElement) {
        return;
      }

      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: listing.lat, lng: listing.lng },
        title: listing.address,
      }) as MarkerLike;

      marker.addListener?.("click", () => {
        onSelectListing(listing.id);
      });
      markersRef.current.push(marker);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 56);
    }

    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
      if (mapInstanceRef.current) {
        googleMapsService.cleanupMapInstance(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  }, [createMap, isLoaded, listings, onSelectListing]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const selected = listings.find((listing) => listing.id === selectedId);
    if (!map || !selected) {
      return;
    }

    map.panTo({ lat: selected.lat, lng: selected.lng });
  }, [listings, selectedId]);

  return { mapRef, isLoaded, error };
}
