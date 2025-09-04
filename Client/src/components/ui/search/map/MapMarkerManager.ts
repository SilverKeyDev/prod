import { MapMarker } from './MapMarker';
import { SearchResult } from '../../../../types/search';

interface MapMarkerCallbacks {
  onSave: (property: SearchResult) => void;
  onUnsave: (propertyId: string) => void;
  onViewDetails: (property: SearchResult) => void;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string) => boolean;
}

/**
 * MapMarkerManager handles the lifecycle of all property markers on the map
 */
export class MapMarkerManager {
  private markers: MapMarker[] = [];
  private map: google.maps.Map | null = null;
  private callbacks: MapMarkerCallbacks;
  private isUpdating = false;

  constructor(callbacks: MapMarkerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Set the Google Maps instance
   */
  setMap(map: google.maps.Map) {
    this.map = map;
  }

  /**
   * Update markers with new property data
   */
  async updateMarkers(properties: SearchResult[], currentPage: number, propertiesPerPage: number, activeTab?: "results" | "saved"): Promise<void> {
    if (!this.map || this.isUpdating) return;

    this.isUpdating = true;

    try {
      // Clear existing markers
      this.clearMarkers();

      // Paginate the results
      const startIndex = currentPage * propertiesPerPage;
      const endIndex = startIndex + propertiesPerPage;
      const paginatedProperties = properties.slice(startIndex, endIndex);

      // Create markers in batches for better performance
      const markerPromises = paginatedProperties.map(async (property) => {
        const mapMarker = new MapMarker(property, this.callbacks, activeTab);
        const marker = mapMarker.createMarker(this.map!);
        
        if (marker) {
          this.markers.push(mapMarker);
        }
        
        return mapMarker;
      });

      await Promise.all(markerPromises);

    } catch (error) {
      console.error('❌ Error updating markers:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Clear all markers from the map
   */
  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  /**
   * Update styling for all markers (e.g., when save status changes)
   */
  updateMarkerStyling(): void {
    this.markers.forEach(marker => marker.updateStyling());
  }

  /**
   * Find marker by property ID
   */
  findMarkerByPropertyId(propertyId: string): MapMarker | undefined {
    return this.markers.find(marker => marker.getProperty().id === propertyId);
  }

  /**
   * Get all current markers
   */
  getMarkers(): MapMarker[] {
    return [...this.markers];
  }

  /**
   * Get all property positions for map fitting
   */
  getPropertyPositions(): google.maps.LatLng[] {
    return this.markers.map(marker => {
      const property = marker.getProperty();
      return new google.maps.LatLng(property.lat, property.lng);
    });
  }

  /**
   * Fit map to show all markers
   */
  fitMapToMarkers(): void {
    if (!this.map || this.markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => {
      const property = marker.getProperty();
      bounds.extend(new google.maps.LatLng(property.lat, property.lng));
    });

    this.map.fitBounds(bounds);
  }

  /**
   * Check if currently updating markers
   */
  isUpdatingMarkers(): boolean {
    return this.isUpdating;
  }

  /**
   * Cleanup all markers and reset state
   */
  cleanup(): void {
    this.clearMarkers();
    this.map = null;
    this.isUpdating = false;
  }
}
