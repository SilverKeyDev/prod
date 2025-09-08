import { OnboardingData } from "./types";
import { log } from "../../../lib/security/secureLogger";
import { preferencesApi } from "../../../api";
import { validateOnboardingData, ValidationResult } from "./validation";

export interface SubmitHandlerParams {
  formData: OnboardingData;
  setLoading: (loading: boolean) => void;
  setValidationResult?: (result: { missingFields: string[]; errors: string[] }) => void;
  setShowValidationWarning?: (show: boolean) => void;
  navigate?: (path: string) => void;
  validateFunction?: (data: OnboardingData) => ValidationResult;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

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
      console.warn("Validation failed:", validation.missingFields, validation.errors);
    }
    return;
  }

  setLoading(true);
  try {
    const result = await preferencesApi.createOrUpdate(formData);
    log.info("ONBOARDING", "Preferences submitted successfully", {
      success: result.success,
    });

    if (result.success) {
      localStorage.removeItem("onboardingDraft");
      onSuccess?.();
      if (navigate) {
        navigate("/dashboard");
      }
    } else {
      throw new Error(result.message || "Failed to save preferences");
      const errorMsg = result.error || "Failed to generate report";
      console.error(
        "[SubmitHandler] Server returned unsuccessful result:",
        result
      );
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("[SubmitHandler] Error in handleSubmit:", error);
    console.error(
      "[SubmitHandler] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

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
    alert(userMessage);
  } finally {
    setLoading(false);
  }
};
