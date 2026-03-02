import { getScoreBasedColor } from "packages/utils/format/scoreColors";
import { getDocument } from "packages/utils/platform";

const PIN_SIZE_PX = 28;

/**
 * Creates a single DOM element for use as AdvancedMarkerElement content:
 * a compact map pin colored by score (0-100). Same gradient as CardMatchScore.
 */
export function createScorePinElement(score: number): HTMLElement {
  const doc = getDocument();
  if (!doc) throw new Error("Document not available");
  const { fillColor, strokeColor } = getScoreBasedColor(score);
  const wrapper = doc.createElement("div");
  wrapper.className = "property-score-pin";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = `
    position: relative;
    width: ${PIN_SIZE_PX}px;
    height: ${PIN_SIZE_PX}px;
    cursor: pointer;
    pointer-events: auto;
  `;
  wrapper.innerHTML = `
    <svg width="${PIN_SIZE_PX}" height="${PIN_SIZE_PX}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
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
