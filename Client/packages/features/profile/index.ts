/**
 * Profile feature barrel. Export public API for apps (e.g. mobile App stack).
 * Native-only screens are in ./native.
 */
// Web pages must not import feature internals; re-export shared profile utilities.
export { AgentPublicProfileView } from "./components/AgentPublicProfileView";
export {
  HousingSection,
  LocationSection,
  PreferencesFormContent,
  PreferencesSaveStatusRow,
  ProfileFinancialSection,
} from "./components/checklistIntegrations";
export {
  LotSizeAndHomeAgeSliders,
  type LotSizeHomeAgeFormSlice,
  type LotSizeHomeAgeSearchOverridesPatch,
} from "./components/LotSizeAndHomeAgeSliders";
export type { ProfileScreenProps } from "./components/ProfileScreen";
export { ProfileScreen } from "./components/ProfileScreen";
export type { PatchBuyerPreferenceExtensions } from "./components/profileScreen/searchPreferences/types";
export { ProfileHousingEssentialsSection } from "./components/profileScreen/sections/housing/ProfileHousingEssentialsSection";
export { ProfileHousingRangesSection } from "./components/profileScreen/sections/housing/ProfileHousingRangesSection";
export { ProfileSearchPropertySection } from "./components/profileScreen/sections/search/ProfileSearchPropertySection";
export { ImportantLocationsInput } from "./components/settings/inputs/locations/ImportantLocationsInput";
export { default as ProfileFeature } from "./components/settings/inputs/ProfileFeature";
export { PersonalizationSettingsScreen } from "./components/settings/PersonalizationSettingsScreen.web";
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
export type { ProfileStep } from "./types/onboarding/onboarding";
export type { BuyerPreferenceExtensions } from "./types/sections/buyerPreferenceExtensions";
export { toBuyerPreferenceExtensions } from "./types/sections/buyerPreferenceExtensions";
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
export { expandProfileAvailabilityToEvents } from "./utils/availability/expandProfileAvailabilityToEvents";
export {
  addAvailabilityFromQuickCreate,
  deleteAvailabilityByEventId,
  newAvailabilityRuleId,
  updateAvailabilityFromEditedEvent,
} from "./utils/availability/profileAvailabilityMutations";
export { primaryOnboardingRoleFromForm } from "./utils/onboarding/role/onboardingRoleSelection";
export { postOnboardingTargetForPrimaryRole } from "./utils/onboarding/role/onboardingToWorkspace";
export { API_GET_KEYS, API_POST_KEYS } from "./utils/onboarding/steps/fieldContract";
export { isOnboardingStepComplete } from "./utils/onboarding/steps/onboardingStepCompletion";
export { getOnboardingStepsMobile } from "./utils/onboarding/steps/steps";
export { HOUSING_TYPE_OPTIONS } from "./utils/public/constants";
export {
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
} from "./utils/public/profileEmptyDisplay";
