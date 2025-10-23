import type { OnboardingData } from "./constants";
import { REQUIRED_FIELDS, FIELD_LABELS } from "./constants";

export type ValidationResult = {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
};

// Mapping of field keys to user-friendly display names
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  age: FIELD_LABELS.AGE,
  gender: FIELD_LABELS.GENDER,
  occupation: FIELD_LABELS.OCCUPATION,
  pets: FIELD_LABELS.PETS,
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
 * Shared validation function for onboarding and personalization forms
 * Used by both OnboardingPage and PersonalizationPage
 * Uses REQUIRED_FIELDS constant to determine which fields are required
 */
export const validateOnboardingData = (
  formData: OnboardingData,
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
    if (REQUIRED_FIELDS[field]) {
      const value = formData[field];
      if (!value || (typeof value === "number" && value <= 0)) {
        missingFields.push(
          FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, " "),
        );
      }
    }
  });

  // Validate down_payment (can be 0, so just check if undefined/null)
  if (REQUIRED_FIELDS.down_payment) {
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
    "gender",
    "occupation",
    "pets",
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
    if (REQUIRED_FIELDS[field]) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missingFields.push(
          FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, " "),
        );
      }
    }
  });

  // Location - Important locations validation
  if (REQUIRED_FIELDS.important_locations) {
    if (
      !formData.important_locations ||
      formData.important_locations.length === 0
    ) {
      missingFields.push(`At least one ${FIELD_LABELS.IMPORTANT_LOCATIONS.toLowerCase()}`);
    } else {
      // Validate each important location has required fields
      formData.important_locations.forEach((location, index: number) => {
        if (!location.name || location.name.trim() === "") {
          missingFields.push(`${FIELD_LABELS.IMPORTANT_LOCATIONS} ${index + 1} name`);
        }
        if (!location.address || location.address.trim() === "") {
          missingFields.push(`${FIELD_LABELS.IMPORTANT_LOCATIONS} ${index + 1} address`);
        }
        if (!location.commute_tolerance || location.commute_tolerance <= 0) {
          missingFields.push(
            `${FIELD_LABELS.IMPORTANT_LOCATIONS} ${index + 1} commute tolerance`,
          );
        }
      });
    }
  }

  // Report Customization - At least one section must be selected
  if (
    !formData.report_section_priorities ||
    formData.report_section_priorities.length === 0
  ) {
    missingFields.push("At least one report section");
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
