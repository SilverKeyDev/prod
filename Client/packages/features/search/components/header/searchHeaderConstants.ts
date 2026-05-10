import { HEADER_ROW_CONTROL_HEIGHT, HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

/**
 * Single source of truth for search header bar height (44px). Re-exports HEADER_ROW_HEIGHT from packages/ui.
 * The row and every control in the search header (locations, filters, Search, Cancel, Reels/Map, ClientSelector)
 * must use this constant and must not exceed 44px. Do not add responsive min-heights or content that grows the row.
 */
export const SEARCH_HEADER_ROW_HEIGHT = HEADER_ROW_HEIGHT;

/** Button / IconButton shells in the search header — see {@link HEADER_ROW_CONTROL_HEIGHT}. */
export const SEARCH_HEADER_CONTROL_HEIGHT = HEADER_ROW_CONTROL_HEIGHT;

/** Max height for search header popover/panel content (e.g. filters, locations). */
export const SEARCH_HEADER_PANEL_MAX_HEIGHT = "85vh";

/** Default filter panel class (scrollbar, padding, width 420px, max height). */
export const SEARCH_HEADER_PANEL_CLASS_DEFAULT =
  "scrollbar-styled p-4 w-[min(90vw,420px)] max-h-[85vh] overflow-y-auto";

/** Narrow panel (e.g. home type) – width 280px. */
export const SEARCH_HEADER_PANEL_CLASS_HOME_TYPE = "scrollbar-styled p-4 w-[min(90vw,280px)]";

/** Locations panel class – width 480px, matches filter panel styling. */
export const SEARCH_HEADER_PANEL_CLASS_LOCATIONS =
  "scrollbar-styled p-4 w-[min(90vw,480px)] max-h-[85vh] overflow-y-auto";
