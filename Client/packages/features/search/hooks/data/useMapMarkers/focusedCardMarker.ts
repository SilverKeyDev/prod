import { addressForMarkerTitle } from "packages/features/search/types/search/formatters/address";
import { getMapFocusedSlotAssignmentsExcludingDismissed } from "packages/features/search/types/search/map/mapCardFocus";
import { searchMapHomeCardZIndex } from "packages/features/search/types/search/map/mapOverlayLayerOrder";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchResult } from "packages/types";
import { escapeHtml } from "packages/utils/dom/escapeHtml";
import { getDocument } from "packages/utils/platform";

import { geocodeAddress } from "./geocode";
import type { GoogleAdvancedMarkerElement, MapPropertyCardRenderProps } from "./types";

type FocusedCardMarkerOptions = {
  activeTab: "results" | "saved";
  map: google.maps.Map;
  markersRef: { current: GoogleAdvancedMarkerElement[] };
  AdvancedMarkerElement: new (opts: {
    map: google.maps.Map;
    position: { lat: number; lng: number };
    title: string;
    content: HTMLElement;
    zIndex?: number | null;
  }) => GoogleAdvancedMarkerElement;
  renderMapPropertyCard: (container: HTMLElement, props: MapPropertyCardRenderProps) => void;
  cleanupMapPropertyCard: (container: HTMLElement) => void;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: SearchResult) => Promise<void>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<void>;
  onMapPreviewNavigate?: (property: SearchResult) => void;
  onUnlockClick?: (property: SearchResult) => void | Promise<void>;
  contextKey?: string;
  dismissedPreviewIds?: ReadonlySet<string>;
  onDismissMapPreview?: (propertyId: string) => void;
  onComplete: () => void;
};

function placeFocusedCardAtCoords(
  focused: SearchResult,
  coordLat: number,
  coordLng: number,
  score: number,
  options: FocusedCardMarkerOptions,
  stackIndex = 0
): void {
  const {
    activeTab,
    map,
    markersRef,
    AdvancedMarkerElement,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    onMapPreviewNavigate,
    onUnlockClick,
    contextKey,
  } = options;
  const hasValidScore = typeof score === "number" && score > 0;
  const propertyData = {
    id: focused.id,
    address: focused.address,
    price: focused.price,
    bedrooms: focused.bedrooms,
    bathrooms: focused.bathrooms,
    sqft: focused.sqft,
    lotSize: focused.lotSize,
    propertyType: focused.propertyType,
    lat: coordLat,
    lng: coordLng,
    images: focused.imageUrl ? [focused.imageUrl] : undefined,
    calculatedScore: hasValidScore ? score : undefined,
    listingStatus: focused.listingStatus,
    homeStatus: focused.homeStatus,
  };

  const doc = getDocument();
  if (!doc) return;
  const markerElement = doc.createElement("div");
  markerElement.className = "property-location-marker";
  markerElement.dataset.markerType = "card";
  const yOff = stackIndex * 14;
  markerElement.style.cssText = `position: relative; transform: translateY(-${yOff}px);`;

  try {
    renderMapPropertyCard(markerElement, {
      activeTab,
      property: propertyData,
      isSaved: isHomeSaved(focused.id, focused.address),
      contextKey,
      onUnlock: onUnlockClick
        ? async () => {
            try {
              await onUnlockClick(focused);
            } catch (error) {
              log.error(
                LOG_CATEGORIES.MAP_RENDERING,
                "🗺️ [USE MAP MARKERS] Error in onUnlockClick:",
                error
              );
              throw error;
            }
          }
        : undefined,
      showScore: hasValidScore,
      isHomeSaved,
      saveHome,
      removeSavedHome,
      onDismissMapPreview: options.onDismissMapPreview,
      onOpenFullDetails: onMapPreviewNavigate
        ? () => {
            onMapPreviewNavigate(focused);
          }
        : undefined,
    });
  } catch (error) {
    log.error(
      LOG_CATEGORIES.MAP_RENDERING,
      `Error rendering MapPropertyCard for focused property ${focused.id}:`,
      error
    );
    markerElement.innerHTML = `
      <div style="background: white; border: 1px solid #ccc; border-radius: 8px; padding: 8px; min-width: 120px;">
        <div style="font-weight: bold; font-size: 12px;">${escapeHtml(
          addressForMarkerTitle(focused.address)
        )}</div>
        <div style="color: #666; font-size: 11px;">${escapeHtml(String(focused.price ?? ""))}</div>
      </div>
    `;
  }

  try {
    const marker = new AdvancedMarkerElement({
      map,
      position: { lat: coordLat, lng: coordLng },
      title: addressForMarkerTitle(focused.address),
      content: markerElement,
      zIndex: searchMapHomeCardZIndex(stackIndex),
    }) as unknown as GoogleAdvancedMarkerElement;
    marker.addListener("gmp-click", () => {
      // Satisfies AdvancedMarkerElement a11y contract; card / X / heart use inner divs.
    });
    markersRef.current.push(marker);
  } catch (error) {
    log.error(LOG_CATEGORIES.MAP_RENDERING, "Error creating focused card marker:", error);
    setTimeout(() => cleanupMapPropertyCard(markerElement), 0);
  }
}

function placeOneFocusedCard(
  focused: SearchResult,
  stackIndex: number,
  options: FocusedCardMarkerOptions,
  onDone: () => void
): void {
  const score =
    typeof focused._score === "number" && focused._score >= 0
      ? focused._score
      : options.calculatePropertyScore(focused);
  const lat = focused.lat;
  const lng = focused.lng;
  const hasZeroOrNullCoords = lat == null || lng == null || lat === 0 || lng === 0;

  if (hasZeroOrNullCoords && focused.address) {
    void geocodeAddress(focused.address).then((coords) => {
      if (coords) {
        placeFocusedCardAtCoords(focused, coords.lat, coords.lng, score, options, stackIndex);
      }
      onDone();
    });
    return;
  }
  if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
    placeFocusedCardAtCoords(focused, lat, lng, score, options, stackIndex);
  }
  onDone();
}

/** @deprecated Use addFocusedCardMarkers with count 1 */
export function addFocusedCardMarker(
  results: SearchResult[],
  currentPage: number,
  options: FocusedCardMarkerOptions
): void {
  addFocusedCardMarkers(results, currentPage, 1, options);
}

export function addFocusedCardMarkers(
  results: SearchResult[],
  startPage: number,
  cardCount: number,
  options: FocusedCardMarkerOptions
): void {
  if (startPage < 0) {
    options.onComplete();
    return;
  }
  const dismissed = options.dismissedPreviewIds ?? new Set<string>();
  const assignments = getMapFocusedSlotAssignmentsExcludingDismissed(
    results,
    startPage,
    cardCount,
    dismissed
  );
  if (assignments.length === 0) {
    options.onComplete();
    return;
  }

  let remaining = assignments.length;
  const check = () => {
    remaining -= 1;
    if (remaining <= 0) {
      options.onComplete();
    }
  };

  assignments.forEach(({ property: focused, slotIndex }) => {
    placeOneFocusedCard(focused, slotIndex, options, check);
  });
}
