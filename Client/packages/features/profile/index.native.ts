/**
 * Native-only exports for mobile app. Do not import from this barrel in the web app.
 *
 * Metro resolves `packages/features/profile` to this file on iOS/Android, so it *replaces*
 * `index.ts`. Members native code imports from the barrel are re-exported here from their own
 * modules. Web-only members (e.g. PreferencesModal, PersonalizationSettingsScreen) are
 * deliberately omitted so they stay out of the native bundle.
 */
export { PreferencesSaveStatusRow } from "./components/checklistIntegrations";
export { LotSizeAndHomeAgeSliders } from "./components/LotSizeAndHomeAgeSliders";
export type { OnboardingScreenNativeProps } from "./components/onboarding";
export { HousingStep, OnboardingScreenNative } from "./components/onboarding";
export { ProfileScreen as ProfileScreenNative } from "./components/ProfileScreen";
export { ImportantLocationsInput } from "./components/settings/inputs/locations/ImportantLocationsInput";
export { default as ProfileFeature } from "./components/settings/inputs/ProfileFeature";
export {
  handleSubmit,
  mergeOnboardingServerAndDraft,
  MUST_HAVE_OPTIONS,
  nextPreferencesVersion,
  userPreferencesToOnboardingData,
} from "./utils";
export { primaryOnboardingRoleFromForm } from "./utils/onboarding/role/onboardingRoleSelection";
export { postOnboardingWorkspaceForPrimaryRole } from "./utils/onboarding/role/onboardingToWorkspace";
export { isOnboardingStepComplete } from "./utils/onboarding/steps/onboardingStepCompletion";
export { getOnboardingStepsMobile } from "./utils/onboarding/steps/steps";
