/**
 * API wire type: HomeUniversal.to_dict() (OpenAPI SavedHome).
 * UI code uses {@link SavedHome} (normalized shape from mapHomeUniversalToSavedHome).
 */
import type { components } from "packages/types/api.generated";
import type { NormalizedSavedHome } from "packages/types/normalizedSavedHome";

export type SavedHomeRecord = components["schemas"]["SavedHome"];

/** Normalized saved home for components, cache, and mappers (legacy name). */
export type SavedHome = NormalizedSavedHome;
