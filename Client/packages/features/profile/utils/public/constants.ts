// Shared constants for onboarding and personalization - barrel file
// Re-exports from split domain modules in packages/utils/product/domain/profile/

import type {
  DropdownOption,
  OnboardingData,
} from "packages/features/profile/types/onboarding/onboarding";

// Re-export types for convenience
export type { DropdownOption, OnboardingData };

export { DEFAULT_REPORT_SECTIONS } from "packages/utils/product/domain/defaultReportSections";

// Re-export labels and section titles
export {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  AVAILABILITY_SUBTITLE,
  FIELD_LABELS,
  LOCATION_SUBTITLE,
  SECTION_TITLES,
} from "packages/utils/product/domain/profile/labels";

// Re-export dropdown options
export {
  ACCESSIBILITY_NEEDS_OPTIONS,
  COMMUNICATION_FREQUENCY_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  GENDER_OPTIONS,
  HOME_AGE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  HVAC_PREFERENCE_OPTIONS,
  INFORMATION_DETAIL_OPTIONS,
  isSelectableOnboardingRolePickerValue,
  LISTING_STATUS_PROFILE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  LOT_SIZE_OPTIONS,
  MUST_HAVE_OPTIONS,
  ONBOARDING_ROLE_COMING_SOON_LABEL,
  ONBOARDING_ROLE_PICKER_OPTIONS,
  PARKING_TYPE_OPTIONS,
  PETS_OPTIONS,
  STORIES_PREFERENCE_OPTIONS,
  WALKABILITY_OPTIONS,
  WHY_JOINING_SILVERKEY_OPTIONS,
} from "packages/utils/product/domain/profile/dropdownOptions";
export {
  INTENDED_PROPERTY_USE_OPTIONS,
  INTENDED_USE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_PREFERENCE_OPTIONS,
} from "packages/utils/product/domain/profile/housingFilterOptions";

// Re-export slider scales
export {
  BATHROOMS_TICK_VALUES,
  BEDROOMS_TICK_VALUES,
  DAYS_ON_MARKET_TICK_VALUES,
  HOME_AGE_YEARS_TICK_VALUES,
  LOT_SIZE_ACRES_TICK_VALUES,
  SQFT_TICK_VALUES,
} from "packages/utils/product/domain/profile/sliderScales";

// Re-export field helpers
export {
  parseAccessibilityNeeds,
  parseHousingTypes,
  serializeAccessibilityNeeds,
  serializeHousingTypes,
} from "packages/utils/product/domain/profile/fieldHelpers";

// Re-export required fields
export {
  REQUIRED_FIELDS_ONBOARDING,
  REQUIRED_FIELDS_ONBOARDING_MOBILE,
  REQUIRED_FIELDS_SETTINGS,
} from "packages/utils/product/domain/profile/requiredFields";
