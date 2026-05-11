/**
 * Search header filter promotion order.
 * Filters listed first are promoted from the More dropdown into the header first when space allows.
 */

/** Filter IDs that can be promoted from More dropdown to header, in priority order. */
export const SEARCH_HEADER_FILTER_PROMOTION_ORDER = ["price", "bedsBaths", "homeType"] as const;

export type SearchHeaderFilterId = (typeof SEARCH_HEADER_FILTER_PROMOTION_ORDER)[number];

/** Gap between filter chips and before the More button (px). */
export const SEARCH_HEADER_FILTER_GAP_PX = 8;
