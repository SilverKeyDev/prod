/**
 * Profile feature barrel. Export public API for apps (e.g. mobile App stack).
 * Native-only screens are in ./native.
 */
// Web pages must not import feature internals; re-export shared profile utilities.
export type { HomePriceResult, OnboardingData } from "./utils";
export {
  calculateAffordableHomePrice,
  FIELD_LABELS,
  handleSubmit,
  SECTION_TITLES,
  validateSettingsData,
} from "./utils";
