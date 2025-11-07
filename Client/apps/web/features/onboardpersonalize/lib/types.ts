// Shared types and interfaces for onboarding and personalization
import React from "react";

export type OnboardingData = {
  // Metadata
  preferences_version?: string;

  // Demographics
  is_agent?: string;
  pets?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  marital_status?: string;

  // Financial
  gross_income?: number;
  home_budget_min?: number;
  home_budget_max?: number;
  credit_score_range?: string;
  down_payment?: number;
  ideal_zip_code?: string;

  // Housing
  preferred_housing_type?: string;
  preferred_bathrooms?: number;
  preferred_bedrooms?: number;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  preferred_home_features?: string[];
  renovation_preference?: string;
  intended_property_use?: string;
  architectural_style_preference?: string;
  deal_breakers?: string[];

  // Location & Housing
  preferred_regions?: { name: string; address: string }[];
  important_locations?: {
    name: string;
    address: string;
    commute_tolerance?: number;
  }[];
  walkability_importance?: string;

  // Communication
  communication_frequency?: string;
  information_detail_level?: string;
  has_buyers_agent?: string; // 'yes' | 'no'
  looking_for_buyers_agent?: boolean;

  // Report Customization
  report_section_priorities?: string[];
};

export type ValidationResult = {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
};

export type StepConfig = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type DropdownOption = {
  value: string;
  label: string;
};
