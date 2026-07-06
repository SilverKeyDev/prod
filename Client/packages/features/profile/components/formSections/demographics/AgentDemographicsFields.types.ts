import type { OnboardingData } from "packages/features/profile/utils";

export type AgentDemographicsFieldsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  hideProfilePictureWhenOnboarding?: boolean;
  hideNameWhenOnboarding?: boolean;
  showWhyJoiningQuestion?: boolean;
};
