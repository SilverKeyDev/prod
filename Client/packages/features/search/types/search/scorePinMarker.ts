import { getMapPinColorsForScoreAndStatus } from "packages/utils/format/listingStatusMapPinColors";
import { getDocument } from "packages/utils/platform";

const BASE_PIN_SIZE_PX = 28;

export type ScorePinElementOptions = {
  /** Listing status from search/API (e.g. For Sale, Pending). */
  listingStatus?: string;
  /** Alternate status field when present (e.g. Zillow homeStatus). */
  homeStatus?: string;
};

/** Scale factor: 0.8x at score 0, 2.0x at score 100. */
function getScorePinScale(score: number): number {
  const t = Math.max(0, Math.min(100, score)) / 100;
  return 0.8 + t * 1.2;
}

/**
 * Creates a single DOM element for use as AdvancedMarkerElement content:
 * a compact map pin colored by match score for active listings; pending, sold,
 * rent, and off-market use distinct colors.
 *
 * Higher scores produce larger, brighter pins (up to 2x); lower scores
 * produce smaller, more muted pins (down to 0.8x).
 */
export function createScorePinElement(
  score: number,
  options?: ScorePinElementOptions,
): HTMLElement {
  const doc = getDocument();
  if (!doc) throw new Error("Document not available");
  const { fillColor, strokeColor } = getMapPinColorsForScoreAndStatus(
    score,
    options?.listingStatus,
    options?.homeStatus,
  );

  const scale = getScorePinScale(score);
  const size = Math.round(BASE_PIN_SIZE_PX * scale);

  const t = Math.max(0, Math.min(100, score)) / 100;
  const saturation = 0.25 + t * 1.05;
  const brightness = 0.85 + t * 0.3;

  const wrapper = doc.createElement("div");
  wrapper.className = "property-score-pin";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = `
    position: relative;
    width: ${size}px;
    height: ${size}px;
    cursor: pointer;
    pointer-events: auto;
    filter: saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(
      2,
    )});
    transition: filter 0.2s ease;
  `;
  wrapper.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${fillColor}"
        stroke="${strokeColor}"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <circle cx="12" cy="12" r="4" fill="${strokeColor}" opacity="0.6"/>
    </svg>
  `;
  return wrapper;
}
