import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { productTourStorageKey } from "./tourSchema";

const COMPLETED_VALUE = "1";

export function isProductTourCompleted(): boolean {
  return getLocalStorage().getItem(productTourStorageKey()) === COMPLETED_VALUE;
}

export function markProductTourCompleted(): void {
  getLocalStorage().setItem(productTourStorageKey(), COMPLETED_VALUE);
}
