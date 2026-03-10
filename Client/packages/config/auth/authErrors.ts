/**
 * Auth error utilities for use by features and hooks.
 * Re-exports from services/http so feature code does not import from packages/services directly.
 */
export type { AuthenticationError } from "../../services/http/compatibility";
export {
  handleAuthenticationError,
  isAuthenticationError,
} from "../../services/http/compatibility";
