import { log, LOG_CATEGORIES } from "packages/logger";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type { OnboardingData } from "./types";
import { validateOnboardingData, type ValidationResult } from "./validation";

export type PreferencesSubmitResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export type SubmitHandlerParams = {
  formData: OnboardingData;
  /** Caller injects API call to avoid utils importing config/api. */
  submitPreferences: (formData: OnboardingData) => Promise<PreferencesSubmitResult>;
  setLoading: (loading: boolean) => void;
  setValidationResult?: (result: { missingFields: string[]; errors: string[] }) => void;
  setShowValidationWarning?: (show: boolean) => void;
  navigate?: (path: string) => void;
  /** When provided and result.success, called instead of navigate("/search") (e.g. for React Native). */
  onSuccessNavigate?: () => void;
  validateFunction?: (data: OnboardingData) => ValidationResult;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Callback to show error toast (avoids utils importing hooks). Caller passes e.g. showErrorToast. */
  onShowError?: (message: string) => void;
};

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
    const result = await submitPreferences(formData);
    log.info(LOG_CATEGORIES.API, "Preferences submitted successfully", {
      success: result.success,
    });

    if (result.success) {
      getLocalStorage().removeItem("onboardingDraft");
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
