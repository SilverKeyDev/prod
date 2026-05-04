/** Bump when steps, copy, or targets change so existing users see the tour again. */
export const TOUR_SCHEMA_VERSION = 2;

export function productTourStorageKey(): string {
  return `silverkey.productTour.v${TOUR_SCHEMA_VERSION}.completed`;
}
