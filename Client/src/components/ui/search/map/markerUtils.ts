interface MarkerColors {
  fillColor: string;
  strokeColor: string;
}

/**
 * Get marker colors based on property score
 */
export function getScoreBasedPinColor(score: number): MarkerColors {
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

  const highColor = { r: 123, g: 158, b: 124 }; // #7B9E7C
  const midColor = { r: 240, g: 233, b: 210 }; // #F0E9D2
  const lowColor = { r: 216, g: 140, b: 140 }; // #D88C8C

  let r: number, g: number, b: number;

  if (normalizedScore >= 0.5) {
    const t = (normalizedScore - 0.5) * 2;
    r = Math.round(midColor.r + (highColor.r - midColor.r) * t);
    g = Math.round(midColor.g + (highColor.g - midColor.g) * t);
    b = Math.round(midColor.b + (highColor.b - midColor.b) * t);
  } else {
    const t = normalizedScore * 2;
    r = Math.round(lowColor.r + (midColor.r - lowColor.r) * t);
    g = Math.round(lowColor.g + (midColor.g - lowColor.g) * t);
    b = Math.round(lowColor.b + (midColor.b - lowColor.b) * t);
  }

  const fillColor = `rgb(${r}, ${g}, ${b})`;
  const strokeColor = `rgb(${Math.round(r * 0.75)}, ${Math.round(
    g * 0.75
  )}, ${Math.round(b * 0.75)})`;

  return { fillColor, strokeColor };
}

/**
 * Create marker element with consistent styling
 */
export function createMarkerElement(fillColor: string, strokeColor: string): HTMLElement {
  const markerElement = document.createElement("div");
  markerElement.style.cssText = `
    width: 20px;
    height: 20px;
    background-color: ${fillColor};
    border: 2px solid ${strokeColor};
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: transform 0.2s ease;
  `;
  
  // Add hover effect
  markerElement.addEventListener('mouseenter', () => {
    markerElement.style.transform = 'scale(1.1)';
  });
  
  markerElement.addEventListener('mouseleave', () => {
    markerElement.style.transform = 'scale(1)';
  });
  
  return markerElement;
}

/**
 * Create overlay container with consistent positioning
 */
export function createOverlayContainer(): HTMLElement {
  const overlayDiv = document.createElement("div");
  overlayDiv.style.cssText = `
    position: absolute;
    transform: translate(-50%, -100%);
    margin-top: -8px;
    z-index: 1000;
    pointer-events: auto;
  `;
  return overlayDiv;
}
