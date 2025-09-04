// Shared constants for onboarding and personalization

import { User, Building, Home, MapPin, MessageSquare, Check } from "lucide-react";
import { StepConfig } from './types';

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
  { id: "market_overview", key: "market_overview", label: "Market Overview", priority: 1 },
  { id: "property_details", key: "property_details", label: "Property Details", priority: 2 },
  { id: "neighborhood_analysis", key: "neighborhood_analysis", label: "Neighborhood Analysis", priority: 3 },
  { id: "comparable_sales", key: "comparable_sales", label: "Comparable Sales", priority: 4 },
  { id: "investment_analysis", key: "investment_analysis", label: "Investment Analysis", priority: 5 },
  { id: "risk_assessment", key: "risk_assessment", label: "Risk Assessment", priority: 6 },
  { id: "recommendations", key: "recommendations", label: "Recommendations", priority: 7 },
  { id: "financial_projections", key: "financial_projections", label: "Financial Projections", priority: 8 },
  { id: "local_amenities", key: "local_amenities", label: "Local Amenities", priority: 9 },
  { id: "transportation", key: "transportation", label: "Transportation", priority: 10 },
  { id: "schools", key: "schools", label: "Schools", priority: 11 },
  { id: "crime_safety", key: "crime_safety", label: "Crime & Safety", priority: 12 },
  { id: "environmental_factors", key: "environmental_factors", label: "Environmental Factors", priority: 13 },
  { id: "future_development", key: "future_development", label: "Future Development", priority: 14 },
  { id: "tax_information", key: "tax_information", label: "Tax Information", priority: 15 },
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
