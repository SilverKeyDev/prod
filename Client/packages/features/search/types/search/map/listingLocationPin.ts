import { color } from "packages/design-tokens";
import { getDocument } from "packages/utils/core/platform";

const LISTING_PIN_FILL = color("olive.DEFAULT");
const LISTING_PIN_STROKE = color("olive.hover");

const PIN_SIZE_PX = 32;

/**
 * DOM content for a single listing on property-details map (AdvancedMarkerElement).
 */
export function createListingLocationPinElement(): HTMLElement {
  const doc = getDocument();
  if (!doc) throw new Error("Document not available");
  const wrapper = doc.createElement("div");
  wrapper.className = "property-listing-location-pin";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = `
    position: relative;
    width: ${PIN_SIZE_PX}px;
    height: ${PIN_SIZE_PX}px;
    pointer-events: none;
  `;
  wrapper.innerHTML = `
    <svg width="${PIN_SIZE_PX}" height="${PIN_SIZE_PX}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${LISTING_PIN_FILL}"
        stroke="${LISTING_PIN_STROKE}"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <circle cx="12" cy="12" r="4" fill="${LISTING_PIN_STROKE}" opacity="0.75"/>
    </svg>
  `;
  return wrapper;
}

const COMMUTE_DEST_PIN_FILL = color("brown.DEFAULT");
const COMMUTE_DEST_PIN_STROKE = color("brown.light");

/**
 * DOM content for a commute destination pin (property-details commute map).
 */
export function createCommuteDestinationPinElement(): HTMLElement {
  const doc = getDocument();
  if (!doc) throw new Error("Document not available");
  const wrapper = doc.createElement("div");
  wrapper.className = "property-commute-destination-pin";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = `
    position: relative;
    width: ${PIN_SIZE_PX}px;
    height: ${PIN_SIZE_PX}px;
    pointer-events: none;
  `;
  wrapper.innerHTML = `
    <svg width="${PIN_SIZE_PX}" height="${PIN_SIZE_PX}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${COMMUTE_DEST_PIN_FILL}"
        stroke="${COMMUTE_DEST_PIN_STROKE}"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <circle cx="12" cy="12" r="4" fill="${COMMUTE_DEST_PIN_STROKE}" opacity="0.75"/>
    </svg>
  `;
  return wrapper;
}
