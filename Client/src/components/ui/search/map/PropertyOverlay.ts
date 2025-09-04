/**
 * Custom Google Maps overlay for property cards
 */
export class PropertyOverlay {
  private div: HTMLElement;
  private position: google.maps.LatLng;
  private overlayView: google.maps.OverlayView;

  constructor(position: google.maps.LatLng, content: HTMLElement) {
    this.position = position;
    this.div = content;
    
    // Create the overlay view instance
    this.overlayView = new google.maps.OverlayView();
    
    // Bind methods to preserve context
    this.overlayView.onAdd = this.onAdd.bind(this);
    this.overlayView.draw = this.draw.bind(this);
    this.overlayView.onRemove = this.onRemove.bind(this);
  }

  onAdd() {
    const panes = this.overlayView.getPanes();
    if (panes) {
      panes.overlayMouseTarget.appendChild(this.div);
    }
  }

  draw() {
    const projection = this.overlayView.getProjection();
    if (projection) {
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.div.style.left = point.x + "px";
        this.div.style.top = point.y + "px";
      }
    }
  }

  onRemove() {
    if (this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }

  /**
   * Set the map for this overlay
   */
  setMap(map: google.maps.Map | null) {
    this.overlayView.setMap(map);
  }

  /**
   * Update overlay position
   */
  updatePosition(newPosition: google.maps.LatLng) {
    this.position = newPosition;
    this.draw();
  }

  /**
   * Get the overlay's DOM element
   */
  getElement(): HTMLElement {
    return this.div;
  }
}
