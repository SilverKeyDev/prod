import type { OnboardingData } from "./constants";
import {
  FIELD_LABELS,
  REQUIRED_FIELDS_ONBOARDING,
  REQUIRED_FIELDS_SETTINGS,
} from "./constants";

export type ValidationResult = {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
};

// Mapping of field keys to user-friendly display names
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  name: FIELD_LABELS.NAME,
  is_agent: FIELD_LABELS.IS_AGENT,
  age: FIELD_LABELS.AGE,
  why_joining_silverkey: FIELD_LABELS.WHY_JOINING_SILVERKEY,
  // gender: FIELD_LABELS.GENDER,
  // occupation: FIELD_LABELS.OCCUPATION,
  // pets: FIELD_LABELS.PETS,
  marital_status: FIELD_LABELS.MARITAL_STATUS,
  children_count: FIELD_LABELS.CHILDREN_COUNT,
  gross_income: FIELD_LABELS.GROSS_INCOME,
  home_budget_min: `${FIELD_LABELS.HOME_BUDGET} Minimum`,
  home_budget_max: `${FIELD_LABELS.HOME_BUDGET} Maximum`,
  credit_score_range: FIELD_LABELS.CREDIT_SCORE_RANGE,
  down_payment: FIELD_LABELS.DOWN_PAYMENT,
  ideal_zip_code: FIELD_LABELS.IDEAL_ZIP_CODE,
  preferred_housing_type: FIELD_LABELS.PREFERRED_HOUSING_TYPE,
  preferred_bedrooms: FIELD_LABELS.PREFERRED_BEDROOMS,
  preferred_bathrooms: FIELD_LABELS.PREFERRED_BATHROOMS,
  preferred_lot_size: FIELD_LABELS.PREFERRED_LOT_SIZE,
  preferred_home_age: FIELD_LABELS.PREFERRED_HOME_AGE,
  preferred_architectural_style: FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE,
  renovation_preference: FIELD_LABELS.RENOVATION_PREFERENCE,
  intended_property_use: FIELD_LABELS.INTENDED_PROPERTY_USE,
  preferred_home_features: FIELD_LABELS.PREFERRED_HOME_FEATURES,
  deal_breakers: FIELD_LABELS.DEAL_BREAKERS,
  important_locations: FIELD_LABELS.IMPORTANT_LOCATIONS,
  walkability_importance: FIELD_LABELS.WALKABILITY_IMPORTANCE,
  communication_frequency: FIELD_LABELS.COMMUNICATION_FREQUENCY,
  information_detail_level: FIELD_LABELS.INFORMATION_DETAIL_LEVEL,
  has_buyers_agent: FIELD_LABELS.HAS_BUYERS_AGENT,
};

/**
 * Core validation function that accepts requiredFields configuration
 * Used internally by validateOnboardingData and validateSettingsData
 */
const validateFormData = (
  formData: OnboardingData,
  requiredFields: Record<string, boolean>,
): ValidationResult => {
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Validate numeric fields
  const numericFields = [
    "age",
    "gross_income",
    "home_budget_min",
    "home_budget_max",
    "preferred_bedrooms",
    "preferred_bathrooms",
  ] as const;

  numericFields.forEach((field) => {
    if (requiredFields[field]) {
      const value = formData[field];
      if (!value || (typeof value === "number" && value <= 0)) {
        missingFields.push(
          FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, " "),
        );
      }
    }
  });

  // Validate down_payment (can be 0, so just check if undefined/null)
  if (requiredFields.down_payment) {
    if (
      formData.down_payment === undefined ||
      formData.down_payment === null ||
      formData.down_payment < 0
    ) {
      missingFields.push(FIELD_DISPLAY_NAMES.down_payment);
    }
  }

  // Validate string fields
  const stringFields = [
    "is_agent",
    // "gender",
    // "occupation",
    // "pets",
    "marital_status",
    "credit_score_range",
    "preferred_housing_type",
    "preferred_lot_size",
    "preferred_home_age",
    "preferred_architectural_style",
    "renovation_preference",
    "intended_property_use",
    "walkability_importance",
    "communication_frequency",
    "information_detail_level",
    "has_buyers_agent",
  ] as const;

  stringFields.forEach((field) => {
    if (requiredFields[field]) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missingFields.push(
          FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, " "),
        );
      }
    }
  });

  // Location - Important locations validation
  if (requiredFields.important_locations) {
    if (
      !formData.important_locations ||
      formData.important_locations.length === 0
    ) {
      missingFields.push(
        `At least one ${FIELD_LABELS.IMPORTANT_LOCATIONS.toLowerCase()}`,
      );
    } else {
      // Validate each important location has required fields
      formData.important_locations.forEach((location, index: number) => {
        if (!location.address || location.address.trim() === "") {
          missingFields.push(
            `${FIELD_LABELS.IMPORTANT_LOCATIONS} ${index + 1} address`,
          );
        }
        // commute_tolerance is optional, but if provided must be >= 0
        if (
          location.commute_tolerance !== undefined &&
          location.commute_tolerance !== null &&
          location.commute_tolerance < 0
        ) {
          errors.push(
            `${FIELD_LABELS.IMPORTANT_LOCATIONS} ${index + 1} commute tolerance must be 0 or greater`,
          );
        }
      });
    }
  }

  // Additional validation rules
  if (
    formData.down_payment &&
    formData.home_budget_max &&
    formData.down_payment > formData.home_budget_max
  ) {
    errors.push("Down payment cannot be higher than home budget.");
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
};

/**
 * Validation function for onboarding forms
 * Uses REQUIRED_FIELDS_ONBOARDING (age is required)
 */
export const validateOnboardingData = (
  formData: OnboardingData,
): ValidationResult => {
  return validateFormData(formData, REQUIRED_FIELDS_ONBOARDING);
};

/**
 * Validation function for settings page
 * Uses REQUIRED_FIELDS_SETTINGS (age is not required)
 */
export const validateSettingsData = (
  formData: OnboardingData,
): ValidationResult => {
  return validateFormData(formData, REQUIRED_FIELDS_SETTINGS);
};
