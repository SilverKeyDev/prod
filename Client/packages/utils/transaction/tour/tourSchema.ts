/** Bump when steps, copy, or targets change so existing users see the tour again. */
export const TOUR_SCHEMA_VERSION = 2;

/** Per spotlight / step; survives partial completion and re-login on the same device. */
export function searchProductTourStepStorageKey(stepId: string): string {
  return `silverkey.productTour.v${TOUR_SCHEMA_VERSION}.step.${stepId}`;
}
