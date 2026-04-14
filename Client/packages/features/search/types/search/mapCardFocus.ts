import type { SearchResult } from "packages/features/search/types/result";

/**
 * Map card focus: all search results are shown as pins on the map; only one
 * "home card" is rendered, for the property at the current page index.
 *
 * When a marker (pin) is clicked:
 * 1. Parent receives onMarkerClick(property)
 * 2. Parent finds index of that property and calls setCurrentPage(index)
 * 3. getMapFocusedProperty(results, currentPage) returns the property to show in the card
 * 4. The single map card re-renders with that property
 */

/**
 * Returns the property that should be shown in the single map card overlay.
 * Use the same results array and currentPage that drive the map pins and sidebar.
 */
export function getMapFocusedProperty(
  results: SearchResult[],
  currentPage: number,
): SearchResult | null {
  if (!results.length || currentPage < 0) return null;
  const index = Math.min(currentPage, results.length - 1);
  return results[index] ?? null;
}

/**
 * Returns the page index for a property by id. Use when handling marker click
 * to set current page so the card and sidebar stay in sync.
 */
export function getPageIndexForProperty(
  results: SearchResult[],
  propertyId: string,
): number {
  const index = results.findIndex((p) => p.id === propertyId);
  return index >= 0 ? index : 0;
}

/**
 * Visible map card window: `count` listings starting at `startPage` (0-based).
 */
export function getMapFocusedProperties(
  results: SearchResult[],
  startPage: number,
  count: number,
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
 * Same as walking the results window, but skips listings whose preview was dismissed (dev map cards).
 * May return fewer than `count` entries.
 */
export function getMapFocusedPropertiesExcludingDismissed(
  results: SearchResult[],
  startPage: number,
  count: number,
  dismissedIds: ReadonlySet<string>,
): SearchResult[] {
  if (!results.length || count < 1 || startPage < 0) return [];
  const out: SearchResult[] = [];
  let idx = startPage;
  while (out.length < count && idx < results.length) {
    const p = results[idx];
    if (p && !dismissedIds.has(p.id)) {
      out.push(p);
    }
    idx += 1;
  }
  return out;
}
