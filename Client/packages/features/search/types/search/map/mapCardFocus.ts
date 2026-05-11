import type { SearchResult } from "packages/features/search/types/domain/result";

/**
 * Map card focus: all search results are shown as pins on the map; only one
 * "home card" is rendered, for the property at the current page index.
 *
 * When a map pin is clicked:
 * 1. Parent receives onMarkerClick(property)
 * 2. Parent sets currentPage to that property’s index so the floating preview card shows it
 * 3. Clicking the preview card opens full details (URL), not the pin click
 */

/**
 * Returns the property that should be shown in the single map card overlay.
 * Use the same results array and currentPage that drive the map pins and sidebar.
 */
export function getMapFocusedProperty(
  results: SearchResult[],
  currentPage: number
): SearchResult | null {
  if (!results.length || currentPage < 0) return null;
  const index = Math.min(currentPage, results.length - 1);
  return results[index] ?? null;
}

/**
 * Returns the page index for a property by id. Use when handling marker click
 * to set current page so the card and sidebar stay in sync.
 */
export function getPageIndexForProperty(results: SearchResult[], propertyId: string): number {
  const index = results.findIndex((p) => p.id === propertyId);
  return index >= 0 ? index : 0;
}

/**
 * Visible map card window: `count` listings starting at `startPage` (0-based).
 */
export function getMapFocusedProperties(
  results: SearchResult[],
  startPage: number,
  count: number
): SearchResult[] {
  if (!results.length || count < 1 || startPage < 0) return [];
  const out: SearchResult[] = [];
  for (let i = 0; i < count; i++) {
    const idx = startPage + i;
    if (idx >= results.length) break;
    const p = results[idx];
    if (p) out.push(p);
  }
  return out;
}

/**
 * Map cards for fixed indices `startPage` … `startPage + count - 1` only.
 * Dismissed listings omit that slot; **later results are not pulled in** to refill the window
 * (closing a preview must not open a different listing’s preview).
 */
export function getMapFocusedSlotAssignmentsExcludingDismissed(
  results: SearchResult[],
  startPage: number,
  count: number,
  dismissedIds: ReadonlySet<string>
): { property: SearchResult; slotIndex: number }[] {
  if (!results.length || count < 1 || startPage < 0) return [];
  const out: { property: SearchResult; slotIndex: number }[] = [];
  for (let slot = 0; slot < count; slot++) {
    const idx = startPage + slot;
    if (idx < 0 || idx >= results.length) break;
    const p = results[idx];
    if (p && !dismissedIds.has(p.id)) {
      out.push({ property: p, slotIndex: slot });
    }
  }
  return out;
}
