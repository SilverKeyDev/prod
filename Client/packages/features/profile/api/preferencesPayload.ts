/**
 * Non-utils public surface for preference payload helpers so other features can import
 * without pulling the profile barrel (cycle risk) or profile/utils (eslint).
 */
export {
  formDataToPreferencesPayload,
  userPreferencesToOnboardingData,
} from "../utils/onboarding/sync/profileFormSync";
