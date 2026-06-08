import type { OnboardingData } from "packages/features/profile/utils";

export type PreferencesFormContentRef = {
  formData: Partial<OnboardingData>;
};

/** Imperative actions for parents (e.g. search filters) to replace form state without field-by-field updates. */
export type PreferencesFormActionsRef = {
  replaceFormData: (next: Partial<OnboardingData>) => void;
};
