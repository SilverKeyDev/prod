/** Must match Server RESULTS_ORDER_BY_ALLOWED and API snake_case JSON. */
export const RESULTS_ORDER_BY_OPTIONS = [
  "match_score",
  "price",
  "distance",
  "bedrooms",
  "bathrooms",
  "lot_size",
  "home_age",
] as const;

export type ResultsOrderBy = (typeof RESULTS_ORDER_BY_OPTIONS)[number];

export function isResultsOrderBy(v: string): v is ResultsOrderBy {
  return (RESULTS_ORDER_BY_OPTIONS as readonly string[]).includes(v);
}

export const DEFAULT_RESULTS_ORDER_BY: ResultsOrderBy = "match_score";

/** Client-side only: ascending = low→high on the numeric sort key (e.g. cheaper first for price). */
export const RESULTS_SORT_DIRECTIONS = ["asc", "desc"] as const;
export type ResultsSortDirection = (typeof RESULTS_SORT_DIRECTIONS)[number];

export function isResultsSortDirection(v: string): v is ResultsSortDirection {
  return (RESULTS_SORT_DIRECTIONS as readonly string[]).includes(v);
}

/** Default sort direction per results column (price/distance ascending; others descending). */
export function defaultSortDirectionForOrderBy(orderBy: ResultsOrderBy): ResultsSortDirection {
  return orderBy === "price" || orderBy === "distance" ? "asc" : "desc";
}

export const MAP_HOME_CARDS_MIN = 1;
export const MAP_HOME_CARDS_MAX = 5;

export function clampMapHomeCardsCount(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAP_HOME_CARDS_MAX, Math.max(MAP_HOME_CARDS_MIN, Math.floor(n)));
}

export type LastSearchContext = {
  search_source: "preferences" | "location";
  viewport_ring?: { lat: number; lng: number }[] | null;
  place_label?: string | null;
  map_center?: { lat: number; lng: number } | null;
  map_zoom?: number | null;
  searched_at?: string | null;
};

export type SearchDisplayPayload = {
  show_commute_overlay: boolean;
  map_home_cards_count: number;
  results_order_by: ResultsOrderBy;
  /** When true, preference post-filters always apply on the server. When false, they apply only when the collected pool has more than 100 homes. */
  preferences_strict_filter?: boolean;
  last_search_context?: LastSearchContext | null;
};
