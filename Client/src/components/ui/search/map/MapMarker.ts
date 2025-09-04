import { PropertyOverlay } from './PropertyOverlay';
import { createOverlayContainer } from './markerUtils';
import { renderMapPropertyCard } from '../../../cards';
import { SearchResult } from '../../../../types/search';
import { setupMarkerClickWithBounce, injectBounceAnimationCSS } from './markerBounceUtils';

interface MapMarkerCallbacks {
  onSave: (property: SearchResult) => void;
  onUnsave: (propertyId: string) => void;
  onViewDetails: (property: SearchResult) => void;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string) => boolean;
}

/**
 * MapMarker class for creating and managing individual property markers
 */
export class MapMarker {
  private marker: google.maps.marker.AdvancedMarkerElement | null = null;
  private overlay: PropertyOverlay | null = null;
  private property: SearchResult;
  private callbacks: MapMarkerCallbacks;
  private activeTab?: "results" | "saved";

  constructor(property: SearchResult, callbacks: MapMarkerCallbacks, activeTab?: "results" | "saved") {
    this.property = property;
    this.callbacks = callbacks;
    this.activeTab = activeTab;
  }

  /**
   * Create and add marker to the map
   */
  createMarker(map: google.maps.Map): google.maps.marker.AdvancedMarkerElement | null {
    if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
      console.warn('AdvancedMarkerElement not available');
      return null;
    }

    // Inject bounce animation CSS
    injectBounceAnimationCSS();

    const { AdvancedMarkerElement } = window.google.maps.marker;
    // Only calculate score for search results, not saved homes
    const score = this.activeTab === "results" ? this.callbacks.calculatePropertyScore(this.property) : 0;
    const isSaved = this.callbacks.isHomeSaved(this.property.id);

    // Create invisible marker element (no colored pin)
    const markerElement = document.createElement("div");
    markerElement.style.cssText = `
      width: 1px;
      height: 1px;
      background: transparent;
      pointer-events: none;
    `;

    // Create the marker
    this.marker = new AdvancedMarkerElement({
      map,
      position: { lat: this.property.lat, lng: this.property.lng },
      title: this.property.address,
      content: markerElement,
    });

    // Setup click listener with bounce animation
    if (this.marker) {
      setupMarkerClickWithBounce(this.marker, () => {
        // Optional: Add any additional click behavior here
      });
    }

    // Create overlay with property card
    this.createOverlay(map, score, isSaved);

    return this.marker;
  }

  /**
   * Create property card overlay
   */
  private createOverlay(map: google.maps.Map, _score: number, isSaved: boolean) {
    const overlayDiv = createOverlayContainer();

    // Render MapPropertyCard into the overlay div
    renderMapPropertyCard(overlayDiv, {
      property: {
        id: this.property.id,
        address: this.property.address,
        price: this.property.price,
        bedrooms: this.property.bedrooms,
        bathrooms: this.property.bathrooms,
        sqft: this.property.sqft,
        lotSize: this.property.lotSize,
        propertyType: this.property.propertyType,
        lat: this.property.lat,
        lng: this.property.lng,
        images: this.property.imageUrl ? [this.property.imageUrl] : []
      },
      isSaved,
      showScore: this.activeTab === "results", // Show scores only for search results, not saved homes
      onSave: () => this.callbacks.onSave(this.property),
      onUnsave: () => this.callbacks.onUnsave(this.property.id)
    });

    // Create and set overlay
    this.overlay = new PropertyOverlay(
      new google.maps.LatLng(this.property.lat, this.property.lng),
      overlayDiv
    );
    this.overlay.setMap(map);

    // Store overlay reference on marker for cleanup
    if (this.marker) {
      (this.marker as any).overlay = this.overlay;
    }
  }

  /**
   * Remove marker and overlay from map
   */
  remove() {
    if (this.marker) {
      this.marker.map = null;
    }
    if (this.overlay) {
      this.overlay.setMap(null);
    }
  }

  /**
   * Update marker styling based on new data
   */
  updateStyling() {
    // No styling needed since we use invisible markers
    // The property card overlay handles all visual representation
    return;
  }

  /**
   * Get the underlying Google Maps marker
   */
  getMarker(): google.maps.marker.AdvancedMarkerElement | null {
    return this.marker;
  }

  /**
   * Get the property data
   */
  getProperty(): SearchResult {
    return this.property;
  }

  /**
   * Get the overlay
   */
  getOverlay(): PropertyOverlay | null {
    return this.overlay;
  }
}
