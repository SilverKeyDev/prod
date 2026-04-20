/**
 * Central map of DOM ids for product tours. Import in feature UI as `id={TOUR_TARGETS_DESKTOP.foo}`.
 * Desktop and mobile use disjoint ids because both layouts mount in the DOM at once.
 */

export const TOUR_TARGETS_DESKTOP = {
  searchLocation: "tour-d-search-location",
  searchRun: "tour-d-search-run",
  resultsTabs: "tour-d-results-tabs",
  resultsList: "tour-d-results-list",
  mapArea: "tour-d-map-area",
} as const;

export const TOUR_TARGETS_MOBILE = {
  searchRun: "tour-m-search-run",
  resultsTabs: "tour-m-results-tabs",
  resultsList: "tour-m-results-list",
  mapArea: "tour-m-map-area",
} as const;
