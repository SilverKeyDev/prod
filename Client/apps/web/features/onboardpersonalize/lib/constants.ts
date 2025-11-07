// Shared constants for onboarding and personalization

import {
  User,
  Building,
  Home,
  MapPin,
  MessageSquare,
  Check,
} from "lucide-react";

import type { StepConfig, OnboardingData, DropdownOption } from "./types";
import type { NavItem } from "../../../../../packages/schemas/navigation";

// Re-export types for convenience
export type { OnboardingData, DropdownOption };

// Consolidated steps configuration for both onboarding and personalization flows
export const STEPS: StepConfig[] = [
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Finances", icon: Building },
  { id: "housing", title: "Housing", icon: Home },
  { id: "location", title: "Location", icon: MapPin },
  { id: "communication", title: "Communication", icon: MessageSquare },
  { id: "reportcustomization", title: "Your priorities", icon: Check },
];

// Helper functions to get steps in different orders for different flows
export const getOnboardingSteps = (): StepConfig[] => STEPS.filter(step => step.id !== "communication");

export const getPersonalizationSteps = (): StepConfig[] => [
  STEPS.find(step => step.id === "reportcustomization")!,
  ...STEPS.filter(step => step.id !== "reportcustomization" && step.id !== "communication" && step.id !== "demographics"),
];

// Helper function to convert StepConfig to NavItem for sidebar navigation
export const convertStepsToNavItems = (steps: StepConfig[]): NavItem[] => 
  steps.map(step => ({
    key: step.id,
    to: `#${step.id}`,
    label: step.title,
    icon: step.icon as any, // Type assertion needed due to different icon types
  }));

// Legacy exports for backward compatibility (deprecated)
export const ONBOARDING_STEPS = STEPS;
export const PERSONALIZATION_STEPS = getPersonalizationSteps();

export const DEFAULT_REPORT_SECTIONS = [
  {
    id: "commute",
    key: "commute",
    label: "Location",
    priority: 1,
  },
  {
    id: "schools",
    key: "schools",
    label: "Schools",
    priority: 2,
  },
  {
    id: "safety",
    key: "safety",
    label: "Crime & Safety",
    priority: 3,
  },
  {
    id: "family_friendly",
    key: "family_friendly",
    label: "Family Friendly",
    priority: 4,
  },
  {
    id: "financial_information",
    key: "financial_information",
    label: "Financial Information",
    priority: 5,
  },
  {
    id: "environment_utilities",
    key: "environment_utilities",
    label: "Environment & Utilities",
    priority: 6,
  },
  {
    id: "development",
    key: "development",
    label: "Future Development",
    priority: 7,
  },
  {
    id: "social_character",
    key: "social_character",
    label: "Social Character",
    priority: 8,
  },
  {
    id: "culture_and_events",
    key: "culture_and_events",
    label: "Culture & Events",
    priority: 9,
  },
  {
    id: "local_amenities",
    key: "local_amenities",
    label: "Local Amenities",
    priority: 10,
  },
  {
    id: "nightlife_and_dating",
    key: "nightlife_and_dating",
    label: "Nightlife & Dating",
    priority: 11,
  },
  {
    id: "extra_tips",
    key: "extra_tips",
    label: "Tips & Recommendations",
    priority: 12,
  },
];



// Shared section titles and labels
export const SECTION_TITLES = {
  FINANCIAL_PROFILE: "Finances",
  HOUSING_PREFERENCES: "Housing",
  LOCATION_PREFERENCES: "Location",
  COMMUNICATION_PREFERENCES: "Communication",
  REPORT_CUSTOMIZATION: "Priorities",
} as const;

// Shared field labels
export const FIELD_LABELS = {
  // Demographics
  IS_AGENT: "Are you a real estate agent?",
  AGE: "Age",
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
  PREFERRED_HOUSING_TYPE: "Desired Housing Type",
  PREFERRED_BEDROOMS: "Bedrooms",
  PREFERRED_BATHROOMS: "Bathrooms",
  PREFERRED_LOT_SIZE: "Lot Size",
  PREFERRED_HOME_AGE: "Home Age",
  PREFERRED_ARCHITECTURAL_STYLE: "Architectural Style",
  RENOVATION_PREFERENCE: "Renovation Willingness",
  INTENDED_PROPERTY_USE: "Intended Property Use",
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
} as const;

// Dropdown options
export const IS_AGENT_OPTIONS: DropdownOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
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
  { value: "single-family", label: "Single-family home" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condominium" },
  { value: "duplex", label: "Duplex" },
  { value: "multi-family", label: "Multi-family" },
  { value: "mobile-home", label: "Mobile home" },
  { value: "other", label: "Other" },
];

export const COMMUNICATION_FREQUENCY_OPTIONS: DropdownOption[] = [
  { value: "daily", label: "Daily updates" },
  { value: "weekly", label: "Weekly summaries" },
  { value: "bi-weekly", label: "Bi-weekly updates" },
  { value: "monthly", label: "Monthly reports" },
  { value: "as-needed", label: "Only when needed" },
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

// Required fields mapping - used to determine if a field needs RequiredLabel or OptionalLabel
export const REQUIRED_FIELDS: Record<string, boolean> = {
  // Demographics
  is_agent: false,
  age: true,
  gender: false,
  occupation: false,
  pets: false,
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
  preferred_home_features: false,
  deal_breakers: false,

  // Location
  important_locations: true,
  walkability_importance: false,

  // Communication
  communication_frequency: false,
  information_detail_level: false,
  has_buyers_agent: false,
  looking_for_buyers_agent: false,
} as const;
