import type { OnboardingData, ValidationResult } from "./onboarding";

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
  /** When provided and result.success, called instead of navigate("/dashboard") (e.g. for React Native). */
  onSuccessNavigate?: () => void;
  validateFunction?: (data: OnboardingData) => ValidationResult;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Callback to show error toast (avoids utils importing hooks). Caller passes e.g. showErrorToast. */
  onShowError?: (message: string) => void;
  /** When true, bypasses pre-submit required-field validation. */
  skipValidation?: boolean;
};
