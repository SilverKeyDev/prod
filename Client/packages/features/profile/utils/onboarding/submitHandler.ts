import { clientSettingsApi } from "packages/features/homeauth/api/clientSettings";
import type { OnboardingData } from "packages/features/profile/types/onboarding";
import type { SubmitHandlerParams } from "packages/features/profile/types/submitHandler";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { formDataToPreferencesPayload } from "./profileFormSync";
import { validateOnboardingData } from "./validation";

export type {
  PreferencesSubmitResult,
  SubmitHandlerParams,
} from "packages/features/profile/types/submitHandler";

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
        log.warn(LOG_CATEGORIES.ERRORS, "Validation failed", {
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
    log.info(LOG_CATEGORIES.PROFILE_PREFERENCES, "handleSubmit.preferencesPayload", {
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
    log.info(LOG_CATEGORIES.API, "Preferences submitted successfully", {
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
        navigate("/search");
      }
    } else {
      const errorMsg = result.error ?? "Failed to generate report";
      log.error(LOG_CATEGORIES.ERRORS, "Server returned unsuccessful result", result);
      throw new Error(result.message ?? errorMsg);
    }
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.ERRORS, "Error in handleSubmit", error);
    log.error(LOG_CATEGORIES.ERRORS, "Error stack", {
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
