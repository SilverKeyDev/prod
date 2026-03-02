/**
 * Re-export from feature api layer for architecture boundary.
 * Callers use this so they do not import config/api directly.
 */
export { fetchStrategyAndComps, type StrategyAndCompsResult } from "../api/strategy";
