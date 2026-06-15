/**
 * Central utils barrel so "packages/utils" resolves.
 * Re-exports commonly used utilities from subpaths.
 */

export { createGuardedSetter } from "./core/array";
export { asError } from "./core/errorHandling";
export { formatCompactCount, formatCompactNumber, formatNumber, formatUSD } from "./core/format";
export { getMapPinColorsForScoreAndStatus } from "./core/format/mapMatchPinColors";
export type { MatchStyle, MatchTier } from "./core/format/matchScore";
export {
  clampMatchScore,
  getMatchStyle,
  getMatchTier,
  getMatchTierIndex,
} from "./core/format/matchScore";
export type { ScoreColors } from "./core/format/scoreColors";
export { getMatchScoreGradientColors } from "./core/format/scoreColors";
export { createBlob, getDocument, getFetch, getNavigator, getWindow } from "./core/platform";
export { simpleHash } from "./core/storage/hash";
export {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage,
} from "./core/storage/storage";
export { hasProperty, isDocumentData, isFunction, isNumber, isObject } from "./core/typeGuards";
export type { RawHomeData, SavedHomeWire } from "./transaction/saved";
export { mapSavedHomeWireToSavedHome } from "./transaction/saved";
