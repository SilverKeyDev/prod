import { preferencesApi } from "../../../../../packages/config/api";
import { showErrorToast } from "../../../../../packages/hooks/ui/useToast";
import { log, LOG_CATEGORIES } from "../../../../../logger";

import type { OnboardingData } from "./types";
import { validateOnboardingData, type ValidationResult } from "./validation";

export type SubmitHandlerParams = {
  formData: OnboardingData;
  setLoading: (loading: boolean) => void;
  setValidationResult?: (result: {
    missingFields: string[];
    errors: string[];
  }) => void;
  setShowValidationWarning?: (show: boolean) => void;
  navigate?: (path: string) => void;
  validateFunction?: (data: OnboardingData) => ValidationResult;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Handle form submission for onboarding/personalization
 * Shared utility function used by both OnboardingPage and PersonalizationPage
 */
export const handleSubmit = async ({
  formData,
  setLoading,
  setValidationResult,
  setShowValidationWarning,
  navigate,
  validateFunction = validateOnboardingData,
  onSuccess,
  onError,
}: SubmitHandlerParams) => {
  // Validate form data before submission
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
      // Fallback to console warning if validation UI not available
      log.warn(LOG_CATEGORIES.ERRORS, "Validation failed", {
        missingFields: validation.missingFields,
        errors: validation.errors,
      });
    }
    return;
  }

  setLoading(true);
  try {
    const result = await preferencesApi.createOrUpdate(formData);
    log.info(LOG_CATEGORIES.API, "Preferences submitted successfully", {
      success: result.success,
    });

    if (result.success) {
      localStorage.removeItem("onboardingDraft");
      onSuccess?.();
      if (navigate) {
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
      userMessage =
        "Server error occurred. Please check your information and try again.";
    } else if (error instanceof Error && error.message.includes("401")) {
      userMessage = "Authentication error. Please log in again.";
    } else if (error instanceof Error && error.message.includes("403")) {
      userMessage = "Access denied. Please check your permissions.";
    }

    onError?.(error instanceof Error ? error : new Error(String(error)));
    showErrorToast(userMessage);
  } finally {
    setLoading(false);
  }
};
