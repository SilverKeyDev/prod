import type { DropdownOption } from "packages/features/profile/types/onboarding/onboarding";

export type { OnboardingRolePickerOption, OnboardingRolePickerValue } from "./onboardingRolePicker";
export {
  isSelectableOnboardingRolePickerValue,
  ONBOARDING_ROLE_COMING_SOON_LABEL,
  ONBOARDING_ROLE_PICKER_OPTIONS,
} from "./onboardingRolePicker";

export const IS_AGENT_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const WHY_JOINING_SILVERKEY_OPTIONS: DropdownOption[] = [
  { value: "browsing_houses", label: "Browsing houses" },
  { value: "buying_house", label: "Buying a house" },
  { value: "selling_house", label: "Selling a house" },
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

/** MLS-style status filter for saved search (post-filter when listings expose status). */
export const LISTING_STATUS_PROFILE_OPTIONS: DropdownOption[] = [
  { value: "", label: "Any" },
  { value: "active", label: "Active / for sale" },
  { value: "pending", label: "Pending" },
  { value: "contingent", label: "Contingent" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "sold", label: "Sold" },
];

export const STORIES_PREFERENCE_OPTIONS: DropdownOption[] = [
  { value: "", label: "No preference" },
  { value: "single", label: "Single-level" },
  { value: "two_plus", label: "Two or more stories" },
  { value: "any", label: "Any" },
];

export const PARKING_TYPE_OPTIONS: DropdownOption[] = [
  { value: "", label: "No preference" },
  { value: "garage", label: "Garage" },
  { value: "covered", label: "Carport / covered" },
  { value: "driveway", label: "Driveway" },
  { value: "street", label: "Street" },
  { value: "none", label: "None needed" },
];

export const ACCESSIBILITY_NEEDS_OPTIONS: DropdownOption[] = [
  { value: "single_level_living", label: "Single-level living" },
  { value: "wide_doorways", label: "Wide doorways" },
  { value: "elevator_access", label: "Elevator access" },
  { value: "step_free_entry", label: "Step-free entry" },
  { value: "accessible_bathroom", label: "Accessible bathroom setup" },
];

export const HVAC_PREFERENCE_OPTIONS: DropdownOption[] = [
  { value: "", label: "No preference" },
  { value: "central_ac", label: "Central A/C" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "radiant", label: "Radiant / boiler" },
  { value: "window_units", label: "Window units OK" },
];

export const INFORMATION_DETAIL_OPTIONS: DropdownOption[] = [
  { value: "high", label: "High Detail" },
  { value: "medium", label: "Medium Detail" },
  { value: "low", label: "Low Detail" },
  { value: "summary", label: "Summary Only" },
];
