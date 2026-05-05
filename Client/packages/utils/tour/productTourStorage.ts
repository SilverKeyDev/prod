import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { getSearchProductTourSteps, type SearchProductTourLayout } from "./productTourSteps";
import { productTourStorageKey, searchProductTourStepStorageKey } from "./tourSchema";

const COMPLETED_VALUE = "1";

function readStepKey(stepId: string): boolean {
  return getLocalStorage().getItem(searchProductTourStepStorageKey(stepId)) === COMPLETED_VALUE;
}

/** Legacy single-key "search desktop tour done" flag; also written when both desktop spots are done per-step. */
export function isProductTourCompleted(): boolean {
  return getLocalStorage().getItem(productTourStorageKey()) === COMPLETED_VALUE;
}

export function markProductTourCompleted(): void {
  getLocalStorage().setItem(productTourStorageKey(), COMPLETED_VALUE);
}

function readStepDoneIncludingLegacy(stepId: string): boolean {
  if (isProductTourCompleted()) return true;
  return readStepKey(stepId);
}

export function isSearchProductTourStepCompleted(stepId: string): boolean {
  return readStepDoneIncludingLegacy(stepId);
}

export function markSearchProductTourStepCompleted(stepId: string): void {
  getLocalStorage().setItem(searchProductTourStepStorageKey(stepId), COMPLETED_VALUE);
  maybeMarkLegacyProductTourComplete();
}

/** When both desktop targets are done, set the legacy key so quick checks stay cheap. */
function maybeMarkLegacyProductTourComplete(): void {
  if (isProductTourCompleted()) return;
  const desktop = getSearchProductTourSteps("desktop");
  if (desktop.every((s) => readStepKey(s.stepId))) {
    markProductTourCompleted();
  }
}

export function hasIncompleteSearchProductTourSteps(layout: SearchProductTourLayout): boolean {
  if (isProductTourCompleted()) return false;
  return getSearchProductTourSteps(layout).some((s) => !readStepDoneIncludingLegacy(s.stepId));
}
