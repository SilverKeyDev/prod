// Shared dropdown options for onboarding and personalization forms

import type { DropdownOption } from "./types";

export const GENDER_OPTIONS: DropdownOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const PETS_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const CREDIT_SCORE_OPTIONS: DropdownOption[] = [
  { value: "poor", label: "Poor (300-579)" },
  { value: "fair", label: "Fair (580-669)" },
  { value: "good", label: "Good (670-739)" },
  { value: "very_good", label: "Very Good (740-799)" },
  { value: "excellent", label: "Excellent (800-850)" },
];

export const HOUSING_TYPE_OPTIONS: DropdownOption[] = [
  { value: "single_family", label: "Single Family Home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  { value: "duplex", label: "Duplex" },
];

export const LOT_SIZE_OPTIONS: DropdownOption[] = [
  { value: "small", label: "Small (under 0.25 acres)" },
  { value: "medium", label: "Medium (0.25 - 0.5 acres)" },
  { value: "large", label: "Large (0.5 - 1 acre)" },
  { value: "very_large", label: "Very Large (1+ acres)" },
];

export const WALKABILITY_OPTIONS: DropdownOption[] = [
  { value: "very_important", label: "Very Important" },
  { value: "somewhat_important", label: "Somewhat Important" },
  { value: "not_important", label: "Not Important" },
];

export const COMMUNICATION_FREQUENCY_OPTIONS: DropdownOption[] = [
  { value: "frequent", label: "Frequent updates" },
  { value: "milestone", label: "Milestone updates" },
  { value: "minimal", label: "Minimal contact" },
];

export const INFORMATION_DETAIL_OPTIONS: DropdownOption[] = [
  { value: "high", label: "High detail" },
  { value: "moderate", label: "Moderate detail" },
  { value: "low", label: "Low detail" },
];

export const BUYERS_AGENT_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes, I have an agent" },
  { value: "no", label: "No, I need help finding one" },
];

export const HOME_AGE_OPTIONS: DropdownOption[] = [
  { value: "new", label: "New Construction (0-5 years)" },
  { value: "recent", label: "Recent (6-15 years)" },
  { value: "established", label: "Established (16-30 years)" },
  { value: "mature", label: "Mature (31-50 years)" },
  { value: "historic", label: "Historic (50+ years)" },
  { value: "no_preference", label: "No Preference" },
];

export const RENOVATION_PREFERENCE_OPTIONS: DropdownOption[] = [
  { value: "move_in_ready", label: "Move-in Ready" },
  { value: "minor_updates", label: "Minor Updates Okay" },
  { value: "major_renovation", label: "Major Renovation Project" },
  { value: "fixer_upper", label: "Complete Fixer-Upper" },
];

export const PROPERTY_USE_OPTIONS: DropdownOption[] = [
  { value: "primary_residence", label: "Primary Residence" },
  { value: "vacation_home", label: "Vacation Home" },
  { value: "investment_property", label: "Investment Property" },
  { value: "rental_property", label: "Rental Property" },
];
