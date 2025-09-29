// Main// Export all shared onboard utilities
export type {
  OnboardingData,
  ValidationResult,
  StepConfig,
  DropdownOption,
} from "./types";
// Explicit re-exports to avoid ambiguity errors from TS2308
export {
  GENDER_OPTIONS,
  PETS_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  LOT_SIZE_OPTIONS,
  WALKABILITY_OPTIONS,
  COMMUNICATION_FREQUENCY_OPTIONS,
  INFORMATION_DETAIL_OPTIONS,
  BUYERS_AGENT_OPTIONS,
  HOME_AGE_OPTIONS,
  RENOVATION_PREFERENCE_OPTIONS,
  PROPERTY_USE_OPTIONS,
} from "./options";
export * from "./validation";
export * from "./constants";
export * from "./utils";
export * from "./homePriceCalculation";
