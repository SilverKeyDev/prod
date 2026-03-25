// Shared constants for onboarding and personalization

import type { DropdownOption, OnboardingData } from "packages/features/profile/types/onboarding";

// Re-export types for convenience
export type { DropdownOption, OnboardingData };

export { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";

// Shared section titles and labels
export const SECTION_TITLES = {
  FINANCIAL_PROFILE: "Finances",
  HOUSING_PREFERENCES: "Housing",
  LOCATION_PREFERENCES: "Location",
  COMMUNICATION_PREFERENCES: "Communication",
  AGENT_PROFESSIONAL_INFO: "Professional Info",
  AGENT_BROKERAGE: "Brokerage",
  AGENT_LICENSING: "Licensing",
  AGENT_PROFILE_AND_SERVICE: "Service Area",
} as const;

/** Location section subtitle (web and native). */
export const LOCATION_SUBTITLE =
  "Locations set an exact search range; give work, family, or frequently visited places.";

// Shared field labels
export const FIELD_LABELS = {
  // Demographics
  NAME: "Name",
  IS_AGENT: "Are you a real estate agent?",
  AGE: "Age",
  WHY_JOINING_SILVERKEY: "Why are you joining SilverKey?",
  GENDER: "Gender",
  MARITAL_STATUS: "Marital Status",
  OCCUPATION: "Occupation",
  PETS: "Pet Ownership Status",
  CHILDREN_COUNT: "Number of Children",

  // Financial
  GROSS_INCOME: "Gross Annual Income",
  HOME_BUDGET: "Budget Range",
  CREDIT_SCORE_RANGE: "Credit Score Range",
  DOWN_PAYMENT: "Down Payment",
  IDEAL_ZIP_CODE: "Ideal Zip Code",

  // Housing
  PREFERRED_HOUSING_TYPE: "Home Type",
  PREFERRED_BEDROOMS: "Bedrooms",
  PREFERRED_BATHROOMS: "Bathrooms",
  PREFERRED_LOT_SIZE: "Lot Size",
  PREFERRED_HOME_AGE: "Home Age",
  MUST_HAVE: "Must-have",
  SQUARE_FEET: "Square feet",
  LISTING_TYPE: "Listing type",
  DAYS_ON_MARKET: "Days on market",
  PREFERRED_ARCHITECTURAL_STYLE: "Architectural Style",
  RENOVATION_PREFERENCE: "Renovation Willingness",
  INTENDED_PROPERTY_USE: "Intended Property Use",
  OTHER_REQUIREMENTS: "Other Requirements",
  PREFERRED_HOME_FEATURES: "Preferred Features",
  DEAL_BREAKERS: "Deal Breakers",

  // Location
  IMPORTANT_LOCATIONS: "Important Locations for Commute",
  WALKABILITY_IMPORTANCE: "Walkability Importance",

  // Communication
  COMMUNICATION_FREQUENCY: "Communication Frequency",
  INFORMATION_DETAIL_LEVEL: "Information Detail Level",
  HAS_BUYERS_AGENT: "Do you currently have a buyer's agent?",
  LOOKING_FOR_BUYERS_AGENT: "I'm looking for a buyer's agent",

  // Agent profile (Professional Info)
  AGENT_BROKERAGE_NAME: "Brokerage Name",
  AGENT_BROKERAGE_BIC: "Brokerage BIC Name",
  AGENT_BROKERAGE_ADDRESS: "Brokerage Address",
  AGENT_BROKERAGE_EMAIL: "Brokerage Email",
  AGENT_BROKERAGE_PHONE: "Brokerage Phone",
  AGENT_PHYSICAL_MAILING_ADDRESS: "Physical Mailing Address",
  AGENT_LICENSED_STATES: "Licensed States",
  AGENT_LICENSE_TYPES: "License Types",
  AGENT_LICENSE_NUMBERS: "License Numbers",
  AGENT_LICENSE_EXPIRATION_DATES: "License Expiration Dates",
  AGENT_BIO: "Bio",
  AGENT_PRIMARY_SERVICE_ZIPS: "Primary Service Zips",
  AGENT_SPECIALTIES: "Specialties",
} as const;

// Dropdown options
export const IS_AGENT_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const WHY_JOINING_SILVERKEY_OPTIONS: DropdownOption[] = [
  { value: "browsing_houses", label: "Browsing houses" },
  { value: "buying_house", label: "Buying a house" },
  { value: "selling_house", label: "Selling a house" },
  { value: "am_agent", label: "Am an agent" },
  { value: "investor", label: "Investor" },
];

export const GENDER_OPTIONS: DropdownOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const PETS_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const CREDIT_SCORE_OPTIONS: DropdownOption[] = [
  { value: "excellent", label: "Excellent (750+)" },
  { value: "good", label: "Good (700-749)" },
  { value: "fair", label: "Fair (650-699)" },
  { value: "poor", label: "Poor (600-649)" },
  { value: "very-poor", label: "Very Poor (<600)" },
  { value: "unknown", label: "I don't know" },
];

export const HOUSING_TYPE_OPTIONS: DropdownOption[] = [
  { value: "house", label: "House" },
  { value: "townhome", label: "Townhome" },
  { value: "multi-family", label: "Multi-family" },
  { value: "condos-co-ops", label: "Condos/co-ops" },
  { value: "lots-land", label: "Lots/land" },
  { value: "apartments", label: "Apartments" },
  { value: "manufactured", label: "Manufactured" },
  { value: "commercial", label: "Commercial" },
];

/** Parse stored preferred_housing_type (comma-separated) into array for multiselect UI. */
export function parseHousingTypes(s: string | undefined): string[] {
  if (!s || typeof s !== "string") return [];
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Serialize selected housing type values for storage (comma-separated). */
export function serializeHousingTypes(arr: string[]): string {
  return arr.filter(Boolean).join(",");
}

export const COMMUNICATION_FREQUENCY_OPTIONS: DropdownOption[] = [
  { value: "daily", label: "Daily updates" },
  { value: "weekly", label: "Weekly summaries" },
  { value: "bi-weekly", label: "Bi-weekly updates" },
  { value: "monthly", label: "Monthly reports" },
  { value: "as-needed", label: "Only when needed" },
];

export const MUST_HAVE_OPTIONS: DropdownOption[] = [
  { value: "basement", label: "Basement" },
  { value: "single_story", label: "Single-story" },
  { value: "garage", label: "Garage" },
  { value: "ac", label: "AC" },
  { value: "heating", label: "Heating" },
  { value: "pool", label: "Pool" },
  { value: "waterfront", label: "Waterfront" },
];

export const LISTING_TYPE_OPTIONS: DropdownOption[] = [
  { value: "owner_posted", label: "Owner posted" },
  { value: "agent_listed", label: "Agent listed" },
  { value: "new_construction", label: "New construction" },
  { value: "foreclosure_action", label: "Foreclosure action" },
  { value: "foreclosed", label: "Foreclosed" },
  { value: "pre_foreclosed", label: "Pre-foreclosed" },
];

// Slider scale values (for range/single sliders)
export const SQFT_TICK_VALUES = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000];
export const DAYS_ON_MARKET_TICK_VALUES = [0, 7, 14, 30, 60, 90, 180, 365];
export const LOT_SIZE_ACRES_TICK_VALUES = [0, 0.25, 0.5, 1, 2, 5];
export const HOME_AGE_YEARS_TICK_VALUES = [5, 15, 30, 50, 100];

export const LOT_SIZE_OPTIONS: DropdownOption[] = [
  { value: "small", label: "Small (under 0.25 acres)" },
  { value: "medium", label: "Medium (0.25-0.5 acres)" },
  { value: "large", label: "Large (0.5-1 acre)" },
  { value: "very-large", label: "Very Large (1+ acres)" },
  { value: "no-preference", label: "No preference" },
];

export const HOME_AGE_OPTIONS: DropdownOption[] = [
  { value: "new", label: "New (0-5 years)" },
  { value: "recent", label: "Recent (6-15 years)" },
  { value: "established", label: "Established (16-30 years)" },
  { value: "mature", label: "Mature (31-50 years)" },
  { value: "historic", label: "Historic (50+ years)" },
  { value: "no-preference", label: "No preference" },
];

export const RENOVATION_PREFERENCE_OPTIONS: DropdownOption[] = [
  { value: "none", label: "None - Move-in Ready" },
  { value: "cosmetic", label: "Cosmetic Updates Only" },
  { value: "moderate", label: "Moderate Renovations" },
  { value: "major", label: "Major Renovations" },
  { value: "fixer-upper", label: "Complete Fixer-Upper" },
];

export const PROPERTY_USE_OPTIONS: DropdownOption[] = [
  { value: "primary", label: "Primary Residence" },
  { value: "secondary", label: "Secondary/Vacation Home" },
  { value: "investment", label: "Investment Property" },
  { value: "mixed", label: "Mixed Use" },
  { value: "airbnb", label: "AirBnB" },
];

export const WALKABILITY_OPTIONS: DropdownOption[] = [
  { value: "very_important", label: "Very Important" },
  { value: "somewhat_important", label: "Somewhat Important" },
  { value: "neutral", label: "Neutral" },
  { value: "not_important", label: "Not Important" },
];

export const INFORMATION_DETAIL_OPTIONS: DropdownOption[] = [
  { value: "high", label: "High Detail" },
  { value: "medium", label: "Medium Detail" },
  { value: "low", label: "Low Detail" },
  { value: "summary", label: "Summary Only" },
];

/** Buyer-preference copy when the signed-in user is an agent (personal search only). */
export const AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT =
  "Optional for agents. Complete this only for personal search recommendations.";

export const AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT =
  "Optional for agents. Add locations here only for personal search recommendations.";

export const AGENT_OPTIONAL_BUYER_FINANCIAL_HINT =
  "Optional for agents. Complete this only for personal affordability and search recommendations.";

// Required fields mapping - used to determine if a field needs RequiredLabel or OptionalLabel
// Base required fields for onboarding (only About You / agent fields required; housing/location optional)
export const REQUIRED_FIELDS_ONBOARDING: Record<string, boolean> = {
  // Demographics
  name: false,
  is_agent: true,
  age: true,
  why_joining_silverkey: false,
  // gender: true,
  // occupation: true,
  // pets: true,
  marital_status: false,
  children_count: true,

  // Financial
  gross_income: false,
  home_budget_min: false,
  home_budget_max: false,
  down_payment: false,
  credit_score_range: false,
  ideal_zip_code: false,

  // Housing
  preferred_housing_type: false,
  preferred_bedrooms: false,
  preferred_bathrooms: false,
  preferred_lot_size: false,
  preferred_home_age: false,
  preferred_architectural_style: false,
  renovation_preference: false,
  intended_property_use: false,
  other_requirements: false,
  preferred_home_features: false,
  deal_breakers: false,
  walkability_importance: false,
  must_have: false,
  preferred_sqft_min: false,
  preferred_sqft_max: false,
  listing_type: false,
  days_on_market_min: false,
  days_on_market_max: false,
  preferred_lot_size_min: false,
  preferred_lot_size_max: false,
  preferred_home_age_min: false,
  preferred_home_age_max: false,

  // Location
  important_locations: false,
  // Communication
  communication_frequency: false,
  information_detail_level: false,
  has_buyers_agent: false,
  looking_for_buyers_agent: false,
} as const;

// Required fields mapping for settings page (age is not required)
export const REQUIRED_FIELDS_SETTINGS: Record<string, boolean> = {
  // Demographics
  name: false,
  is_agent: false,
  age: false,
  why_joining_silverkey: false,
  gender: false,
  occupation: false,
  // pets: false,
  marital_status: false,
  children_count: false,

  // Financial
  gross_income: false,
  home_budget_min: true,
  home_budget_max: true,
  down_payment: false,
  credit_score_range: false,
  ideal_zip_code: false,

  // Housing
  preferred_housing_type: false,
  preferred_bedrooms: true,
  preferred_bathrooms: true,
  preferred_lot_size: false,
  preferred_home_age: false,
  preferred_architectural_style: false,
  renovation_preference: false,
  intended_property_use: false,
  other_requirements: false,
  preferred_home_features: false,
  deal_breakers: false,
  walkability_importance: false,
  must_have: false,
  preferred_sqft_min: false,
  preferred_sqft_max: false,
  listing_type: false,
  days_on_market_min: false,
  days_on_market_max: false,
  preferred_lot_size_min: false,
  preferred_lot_size_max: false,
  preferred_home_age_min: false,
  preferred_home_age_max: false,

  // Location
  important_locations: true,

  // Communication
  communication_frequency: false,
  information_detail_level: false,
  has_buyers_agent: false,
  looking_for_buyers_agent: false,
} as const;

/** Required fields for mobile onboarding. Kept in sync with web (REQUIRED_FIELDS_ONBOARDING). */
export const REQUIRED_FIELDS_ONBOARDING_MOBILE: Record<string, boolean> = {
  ...REQUIRED_FIELDS_ONBOARDING,
};

// Legacy export for backward compatibility (deprecated - use REQUIRED_FIELDS_ONBOARDING or REQUIRED_FIELDS_SETTINGS)
export const REQUIRED_FIELDS = REQUIRED_FIELDS_ONBOARDING;
