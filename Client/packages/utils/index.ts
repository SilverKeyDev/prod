/**
 * Central utils barrel so "packages/utils" resolves.
 * Re-exports commonly used utilities from subpaths.
 */

export { createGuardedSetter } from "./array";
export { asError } from "./errorHandling";
export { formatCompactCount, formatCompactNumber, formatNumber, formatUSD } from "./format";
export { getMapPinColorsForScoreAndStatus } from "./format/listingStatusMapPinColors";
export type { ScoreColors } from "./format/scoreColors";
export type { MatchStyle, MatchTier } from "./format/matchScore";
export {
  clampMatchScore,
  getMatchStyle,
  getMatchTier,
  getMatchTierIndex,
} from "./format/matchScore";
export { getMatchScoreGradientColors, getScoreBasedColorForMap } from "./format/scoreColors";
export { createBlob, getDocument, getFetch, getNavigator, getWindow } from "./platform";
export type { PropertyData, RawHomeData } from "./saved";
export { mapHomeUniversalToSavedHome } from "./saved";
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
