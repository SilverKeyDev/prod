import { clientSettingsApi } from "packages/features/homeauth/api/clientSettings";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { SubmitHandlerParams } from "packages/features/profile/types/onboarding/submitHandler";
import { log } from "packages/logger";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

import { primaryOnboardingRoleFromForm } from "@/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { postOnboardingTargetForPrimaryRole } from "@/features/profile/utils/onboarding/role/onboardingToWorkspace";
import { formDataToPreferencesPayload } from "@/features/profile/utils/onboarding/sync/profileFormSync";
import { validateOnboardingData } from "@/features/profile/utils/onboarding/validation/validation";

/** Default post-onboarding route by primary role (canonical paths). */
export function postOnboardingPathForForm(formData: OnboardingData): string {
  return postOnboardingTargetForPrimaryRole(primaryOnboardingRoleFromForm(formData)).path;
}

export type {
  PreferencesSubmitResult,
  SubmitHandlerParams,
} from "packages/features/profile/types/onboarding/submitHandler";

/**
 * Handle form submission for onboarding/personalization
 * Shared utility function used by both OnboardingPage and PersonalizationPage
 */
export const handleSubmit = async ({
  formData,
  submitPreferences,
  setLoading,
  setValidationResult,
  setShowValidationWarning,
  navigate,
  onSuccessNavigate,
  validateFunction = validateOnboardingData,
  onSuccess,
  onError,
  onShowError,
  skipValidation = false,
}: SubmitHandlerParams) => {
  // Validate form data before submission
  if (!skipValidation) {
    const validation = validateFunction(formData);

    if (!validation.isValid) {
      // Show the custom validation warning component if available
      if (setValidationResult && setShowValidationWarning) {
        setValidationResult({
          missingFields: validation.missingFields,
          errors: validation.errors,
        });
        setShowValidationWarning(true);
      } else {
        // Fallback to warning log if validation UI not available
        log.warn("ERRORS", "Validation failed", {
          missingFields: validation.missingFields,
          errors: validation.errors,
        });
      }
      return;
    }
  }

  setLoading(true);
  try {
    const payload = formDataToPreferencesPayload(formData);
    const payloadIl = payload.important_locations;
    log.info("PROFILE_PREFERENCES", "handleSubmit.preferencesPayload", {
      formHasImportantLocationsKey: Object.prototype.hasOwnProperty.call(
        formData,
        "important_locations"
      ),
      formImportantLocationsLen: Array.isArray(formData.important_locations)
        ? formData.important_locations.length
        : null,
      payloadHasImportantLocationsKey: Object.prototype.hasOwnProperty.call(
        payload,
        "important_locations"
      ),
      payloadImportantLocationsLen: Array.isArray(payloadIl) ? payloadIl.length : null,
    });
    const result = await submitPreferences(payload as OnboardingData);
    log.info("API", "Preferences submitted successfully", {
      success: result.success,
    });

    if (result.success) {
      getLocalStorage().removeItem("onboardingDraft");
      void clientSettingsApi.patch({ onboarding_draft: null }).catch(() => {
        /* best-effort clear of server draft */
      });
      onSuccess?.();
      if (onSuccessNavigate) {
        onSuccessNavigate();
      } else if (navigate) {
        navigate(postOnboardingPathForForm(formData));
      }
    } else {
      const errorMsg = result.error ?? "Failed to generate report";
      log.error("ERRORS", "Server returned unsuccessful result", result);
      throw new Error(result.message ?? errorMsg);
    }
  } catch (error: unknown) {
    log.error("ERRORS", "Error in handleSubmit", error);
    log.error("ERRORS", "Error stack", {
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    // More user-friendly error message
    let userMessage = "Failed to generate report. Please try again.";
    if (error instanceof Error && error.message.includes("500")) {
      userMessage = "Server error occurred. Please check your information and try again.";
    } else if (error instanceof Error && error.message.includes("401")) {
      userMessage = "Authentication error. Please log in again.";
    } else if (error instanceof Error && error.message.includes("403")) {
      userMessage = "Access denied. Please check your permissions.";
    }

    onError?.(error instanceof Error ? error : new Error(String(error)));
    onShowError?.(userMessage);
  } finally {
    setLoading(false);
  }
};
