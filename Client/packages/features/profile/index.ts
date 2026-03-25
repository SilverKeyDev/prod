/**
 * Profile feature barrel. Export public API for apps (e.g. mobile App stack).
 * Native-only screens are in ./native.
 */
// Web pages must not import feature internals; re-export shared profile utilities.
export {
  LotSizeAndHomeAgeSliders,
  type LotSizeHomeAgeFormSlice,
  type LotSizeHomeAgeSearchOverridesPatch,
} from "./components/LotSizeAndHomeAgeSliders";
export type { AgentProfileFormFieldKey, ProfileStepId, ProfileUiSurface } from "./types";
export {
  AGENT_ONLY_SECTION_IDS,
  AGENT_PROFILE_FORM_FIELD_KEYS,
  BUYER_FACING_DEMOGRAPHICS_FIELD_KEYS,
  BUYER_PERSONALIZATION_SECTION_IDS,
  getStepIdsForSurface,
  isBuyerFacingDemographicsOptionalForAgent,
  PROFILE_STEP_IDS,
} from "./types";
export type { OnboardingData, PreferencesSubmitResult } from "./utils";
export {
  FIELD_LABELS,
  formDataToPreferencesPayload,
  handleSubmit,
  mergeOnboardingServerAndDraft,
  nextPreferencesVersion,
  SECTION_TITLES,
  userPreferencesToOnboardingData,
  validateSettingsData,
} from "./utils";
export { API_GET_KEYS, API_POST_KEYS } from "./utils/fieldContract";
