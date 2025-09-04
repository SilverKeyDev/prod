/**
 * Bounce animation utility for map markers
 */

/**
 * Add bounce animation to a marker element
 */
export function addBounceAnimation(element: HTMLElement): void {
  // Remove any existing animation
  element.style.animation = 'none';
  
  // Force reflow to ensure animation removal takes effect
  element.offsetHeight;
  
  // Add bounce animation
  element.style.animation = 'markerBounce 0.6s ease-out';
}

/**
 * Add bounce animation to an AdvancedMarkerElement
 */
export function addMarkerBounceAnimation(marker: google.maps.marker.AdvancedMarkerElement): void {
  const content = marker.content as HTMLElement;
  if (content) {
    addBounceAnimation(content);
  }
}

/**
 * Setup click listener with bounce animation for AdvancedMarkerElement
 */
export function setupMarkerClickWithBounce(
  marker: google.maps.marker.AdvancedMarkerElement,
  clickHandler?: () => void
): void {
  marker.addListener('click', () => {
    // Add bounce animation
    addMarkerBounceAnimation(marker);
    
    // Call custom click handler if provided
    if (clickHandler) {
      clickHandler();
    }
  });
}

/**
 * Inject CSS keyframes for bounce animation into the document
 */
export function injectBounceAnimationCSS(): void {
  // Check if styles already exist
  if (document.getElementById('marker-bounce-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'marker-bounce-styles';
  style.textContent = `
    @keyframes markerBounce {
      0% {
        transform: translateY(0) scale(1);
      }
      25% {
        transform: translateY(-8px) scale(1.1);
      }
      50% {
        transform: translateY(-12px) scale(1.15);
      }
      75% {
        transform: translateY(-4px) scale(1.05);
      }
      100% {
        transform: translateY(0) scale(1);
      }
    }
  `;
  
  document.head.appendChild(style);
}
