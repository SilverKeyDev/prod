/**
 * Central map of DOM ids for product tours. Import in feature UI as `id={TOUR_TARGETS_DESKTOP.foo}`.
 * Desktop and mobile use disjoint ids because both layouts mount in the DOM at once.
 */

export const TOUR_TARGETS_DESKTOP = {
  preferencesControl: "tour-d-preferences",
} as const;

export const TOUR_TARGETS_MOBILE = {
  preferencesControl: "tour-m-preferences",
} as const;
