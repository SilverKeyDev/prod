/**
 * Profile feature barrel. Export public API for apps (e.g. mobile App stack).
 * Native-only screens are in ./native.
 */
// Web pages must not import feature internals; re-export shared profile utilities.
export { AgentPublicProfileView } from "./components/AgentPublicProfileView";
export {
  LotSizeAndHomeAgeSliders,
  type LotSizeHomeAgeFormSlice,
  type LotSizeHomeAgeSearchOverridesPatch,
} from "./components/LotSizeAndHomeAgeSliders";
export type { ProfileScreenProps } from "./components/ProfileScreen";
export { ProfileScreen } from "./components/ProfileScreen";
export type { PatchBuyerPreferenceExtensions } from "./components/profileScreen/searchPreferences/types";
export { ProfileHousingEssentialsSection } from "./components/profileScreen/sections/ProfileHousingEssentialsSection";
export { ProfileHousingRangesSection } from "./components/profileScreen/sections/ProfileHousingRangesSection";
export { ProfileSearchPropertySection } from "./components/profileScreen/sections/ProfileSearchPropertySection";
export { default as LocationSection } from "./components/sections/LocationSection";
export { ImportantLocationsInput } from "./components/settings/inputs/locations/ImportantLocationsInput";
export { default as ProfileFeature } from "./components/settings/inputs/ProfileFeature";
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
export type { BuyerPreferenceExtensions } from "./types/buyerPreferenceExtensions";
export { toBuyerPreferenceExtensions } from "./types/buyerPreferenceExtensions";
export type { OnboardingData, PreferencesSubmitResult } from "./utils";
export {
  FIELD_LABELS,
  formDataToPreferencesPayload,
  handleSubmit,
  mergeOnboardingServerAndDraft,
  MUST_HAVE_OPTIONS,
  nextPreferencesVersion,
  SECTION_TITLES,
  userPreferencesToOnboardingData,
  validateSettingsData,
} from "./utils";
export { API_GET_KEYS, API_POST_KEYS } from "./utils/onboarding/fieldContract";
