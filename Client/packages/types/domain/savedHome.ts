/**
 * API wire type: OpenAPI SavedHome (PropertyCache + UserPropertyLink).
 * UI code uses {@link SavedHome} (normalized shape from mapSavedHomeWireToSavedHome).
 */
import type { components } from "packages/types/api.generated";

import type { NormalizedSavedHome } from "./normalizedSavedHome";

export type SavedHomeRecord = components["schemas"]["SavedHome"];

/** Normalized saved home for components, cache, and mappers (legacy name). */
export type SavedHome = NormalizedSavedHome;
