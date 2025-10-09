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

// Re-export types for convenience
export type { OnboardingData, DropdownOption };

export const ONBOARDING_STEPS: StepConfig[] = [
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "communication", title: "Communication", icon: MessageSquare },
  { id: "reportcustomization", title: "Report Customization", icon: Check },
];

export const PERSONALIZATION_STEPS: StepConfig[] = [
  { id: "reportcustomization", title: "Priorities", icon: Building },
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "communication", title: "Communication", icon: MessageSquare },
];

export const DEFAULT_REPORT_SECTIONS = [
  {
    id: "market_overview",
    key: "market_overview",
    label: "Market Overview",
    priority: 1,
  },
  {
    id: "property_details",
    key: "property_details",
    label: "Property Details",
    priority: 2,
  },
  {
    id: "neighborhood_analysis",
    key: "neighborhood_analysis",
    label: "Neighborhood",
    priority: 3,
  },
  {
    id: "comparable_sales",
    key: "comparable_sales",
    label: "Comparable Sales",
    priority: 4,
  },
  {
    id: "investment_analysis",
    key: "investment_analysis",
    label: "Investment Analysis",
    priority: 5,
  },
  {
    id: "risk_assessment",
    key: "risk_assessment",
    label: "Risk Assessment",
    priority: 6,
  },
  {
    id: "recommendations",
    key: "recommendations",
    label: "Recommendations",
    priority: 7,
  },
  {
    id: "financial_projections",
    key: "financial_projections",
    label: "Financial Projections",
    priority: 8,
  },
  {
    id: "local_amenities",
    key: "local_amenities",
    label: "Local Amenities",
    priority: 9,
  },
  {
    id: "transportation",
    key: "transportation",
    label: "Transportation",
    priority: 10,
  },
  { id: "schools", key: "schools", label: "Schools", priority: 11 },
  {
    id: "crime_safety",
    key: "crime_safety",
    label: "Crime & Safety",
    priority: 12,
  },
  {
    id: "environmental_factors",
    key: "environmental_factors",
    label: "Environmental Factors",
    priority: 13,
  },
  {
    id: "future_development",
    key: "future_development",
    label: "Future Development",
    priority: 14,
  },
  {
    id: "tax_information",
    key: "tax_information",
    label: "Tax Information",
    priority: 15,
  },
];

// Shared section titles and labels
export const SECTION_TITLES = {
  DEMOGRAPHICS: "Demographics",
  FINANCIAL_PROFILE: "Finances",
  HOUSING_PREFERENCES: "Housing",
  LOCATION_PREFERENCES: "Location",
  COMMUNICATION_PREFERENCES: "Communication",
  REPORT_CUSTOMIZATION: "Priorities",
} as const;

// Shared field labels
export const FIELD_LABELS = {
  // Demographics
  AGE: "Age",
  GENDER: "Gender",
  MARITAL_STATUS: "Marital Status",
  OCCUPATION: "Occupation",
  PETS: "Pet Ownership Status",
  CHILDREN_COUNT: "Number of Children",

  // Financial
  GROSS_INCOME: "Gross Annual Income",
  HOME_BUDGET: "Home Budget",
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
export const GENDER_OPTIONS: DropdownOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

export const PETS_OPTIONS: DropdownOption[] = [
  { value: "none", label: "No pets" },
  { value: "dog", label: "Dog(s)" },
  { value: "cat", label: "Cat(s)" },
  { value: "both", label: "Both dogs and cats" },
  { value: "other", label: "Other pets" },
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
  age: true,
  gender: false,
  occupation: false,
  pets: false,
  marital_status: false,
  children_count: false,

  // Financial
  gross_income: false,
  home_budget: true,
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
