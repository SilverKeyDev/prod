/**
 * Abort utilities for use by features and hooks.
 * Re-exports from services/http so feature code does not import from packages/services directly.
 */
export { createAbortManager, isAbortError } from "../../services/http/compatibility";
