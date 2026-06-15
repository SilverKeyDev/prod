import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

export type WorkspaceShellSetupCopy = {
  title: string;
  subtitle: string;
  inputLabel: string;
};

export type WorkspaceShellSetupStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
  copy: WorkspaceShellSetupCopy;
};
