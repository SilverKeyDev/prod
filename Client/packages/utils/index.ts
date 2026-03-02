/**
 * Central utils barrel so "packages/utils" resolves.
 * Re-exports commonly used utilities from subpaths.
 */

export { createGuardedSetter } from "./array";
export { asError } from "./errorHandling";
export { formatCompactCount, formatCompactNumber, formatNumber, formatUSD } from "./format";
export { getScoreBasedColor } from "./format/scoreColors";
export { createBlob, getDocument, getFetch, getNavigator, getWindow } from "./platform";
export { simpleHash } from "./storage/hash";
export {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage,
} from "./storage/storage";
export { hasProperty, isDocumentData, isFunction, isNumber, isObject } from "./typeGuards";

// Legacy auth utilities (deprecated) - re-exported so packages/services can import from packages/utils
export {
  clearAuthTokens,
  getAuthToken,
  hasValidAuthToken,
} from "packages/features/homeauth/utils/auth";
