// Shared types and interfaces for onboarding and personalization

import type { ProfileStepId } from "packages/features/profile/types/profileStepIds";

export type OnboardingData = {
  // Metadata
  preferences_version?: string;

  // Demographics
  name?: string;
  is_agent?: string;
  pets?: string;
  age?: number;
  why_joining_silverkey?: string[];
  gender?: string;
  occupation?: string;
  marital_status?: string;
  children_count?: number;

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
  /** Optional max for search filter (not persisted); use with preferred_bathrooms as min */
  preferred_bathrooms_max?: number;
  /** Optional max for search filter (not persisted); use with preferred_bedrooms as min */
  preferred_bedrooms_max?: number;
  /** Search filter: FOR_SALE | PENDING | SOLD | "" for all */
  listing_status?: string;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_lot_size_min?: number; // acres (slider)
  preferred_lot_size_max?: number; // acres (slider)
  preferred_home_age_min?: number; // min age in years (range slider)
  preferred_home_age_max?: number; // max age in years (range slider)
  preferred_architectural_style?: string;
  /** Unified "other requirements" (e.g. street parking, no gated communities). Replaces preferred_home_features + deal_breakers in UI. */
  other_requirements?: string[];
  preferred_home_features?: string[];
  must_have?: string[]; // basement, single-story, garage, AC, heating, pool, waterfront
  preferred_sqft_min?: number;
  preferred_sqft_max?: number;
  listing_type?: string[]; // owner posted, agent listed, new construction, etc.
  days_on_market_min?: number;
  days_on_market_max?: number;
  renovation_preference?: string;
  intended_property_use?: string;
  architectural_style_preference?: string;
  deal_breakers?: string[];

  // Location & Housing
  preferred_regions?: { name: string; address: string }[];
  important_locations?: {
    address: string;
    commute_tolerance?: number;
  }[];
  walkability_importance?: string;

  // Communication
  communication_frequency?: string;
  information_detail_level?: string;
  has_buyers_agent?: string; // 'yes' | 'no'
  looking_for_buyers_agent?: boolean;

  // Agent profile (only when is_agent is yes/am_agent)
  agent_physical_mailing_address?: string;
  agent_licensed_states?: string[];
  agent_license_types?: string[];
  agent_license_numbers?: string[];
  agent_license_expiration_dates?: string[];
  agent_mls_affiliations?: Record<string, unknown>[];
  agent_brokerage_name?: string;
  agent_brokerage_bic_name?: string;
  agent_brokerage_address?: string;
  agent_brokerage_email?: string;
  agent_brokerage_phone?: string;
  agent_bio?: string;
  agent_primary_service_zips?: string[];
  agent_specialties?: string[];
  agent_social_links?: Record<string, string>;
};

export type ValidationResult = {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
};

export type ProfileStep = {
  id: ProfileStepId;
  title: string;
};

export type { ProfileStepId } from "packages/features/profile/types/profileStepIds";

export type DropdownOption = {
  value: string;
  label: string;
};
