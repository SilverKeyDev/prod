import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { getSearchProductTourSteps, type SearchProductTourLayout } from "./productTourSteps";
import { searchProductTourStepStorageKey } from "./tourSchema";

const COMPLETED_VALUE = "1";

function readStepKey(stepId: string): boolean {
  return getLocalStorage().getItem(searchProductTourStepStorageKey(stepId)) === COMPLETED_VALUE;
}

export function isSearchProductTourStepCompleted(stepId: string): boolean {
  return readStepKey(stepId);
}

export function markSearchProductTourStepCompleted(stepId: string): void {
  getLocalStorage().setItem(searchProductTourStepStorageKey(stepId), COMPLETED_VALUE);
}

export function hasIncompleteSearchProductTourSteps(layout: SearchProductTourLayout): boolean {
  return getSearchProductTourSteps(layout).some((s) => !readStepKey(s.stepId));
}
