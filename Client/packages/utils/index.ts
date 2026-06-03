/**
 * Central utils barrel so "packages/utils" resolves.
 * Re-exports commonly used utilities from subpaths.
 */

export { createGuardedSetter } from "./array";
export { asError } from "./errorHandling";
export { formatCompactCount, formatCompactNumber, formatNumber, formatUSD } from "./format";
export { getMapPinColorsForScoreAndStatus } from "./format/mapMatchPinColors";
export type { MatchStyle, MatchTier } from "./format/matchScore";
export {
  clampMatchScore,
  getMatchStyle,
  getMatchTier,
  getMatchTierIndex,
} from "./format/matchScore";
export type { ScoreColors } from "./format/scoreColors";
export { getMatchScoreGradientColors } from "./format/scoreColors";
export { createBlob, getDocument, getFetch, getNavigator, getWindow } from "./platform";
export type { RawHomeData, SavedHomeWire } from "./saved";
export { mapSavedHomeWireToSavedHome } from "./saved";
export { simpleHash } from "./storage/hash";
export {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage,
} from "./storage/storage";
export { hasProperty, isDocumentData, isFunction, isNumber, isObject } from "./typeGuards";
