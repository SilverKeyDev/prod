import { getMapPinColorsForScoreAndStatus } from "packages/utils/format/mapMatchPinColors";
import { getMatchTierIndex } from "packages/utils/format/matchScore";
import { getDocument } from "packages/utils/platform";

const BASE_PIN_SIZE_PX = 28;
const MATCH_TIER_COUNT = 5;

/** Scale factor by match tier only: 0.8x (poor) … 2.0x (excellent), five steps. */
function getScorePinScale(score: number): number {
  const i = getMatchTierIndex(score);
  const t = i / Math.max(1, MATCH_TIER_COUNT - 1);
  return 0.8 + t * 1.2;
}

/**
 * Creates a single DOM element for use as AdvancedMarkerElement content:
 * compact map pin colored by match tier (same as MatchPill).
 *
 * Higher score buckets produce larger pins (up to 2x); lower buckets
 * produce smaller pins (down to 0.8x). Color and size are both bucketed.
 */
export function createScorePinElement(score: number): HTMLElement {
  const doc = getDocument();
  if (!doc) throw new Error("Document not available");
  const { fillColor, strokeColor } = getMapPinColorsForScoreAndStatus(score);

  const scale = getScorePinScale(score);
  const size = Math.round(BASE_PIN_SIZE_PX * scale);

  const wrapper = doc.createElement("div");
  wrapper.className = "property-score-pin";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = `
    position: relative;
    width: ${size}px;
    height: ${size}px;
    cursor: pointer;
    pointer-events: auto;
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
