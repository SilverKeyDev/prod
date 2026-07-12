// Shared types and interfaces for onboarding and personalization

import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import type { components } from "packages/types/api.generated";

import type { ProfileStepId } from "./profileStepIds";

/** Agent-managed testimonial; matches the OpenAPI `AgentTestimonial` schema. */
export type AgentTestimonial = components["schemas"]["AgentTestimonial"];

export type OnboardingData = {
  // Metadata
  preferences_version?: string;

  // Demographics
  /** Draft-only: first-screen role selection; stripped from preferences API payload. */
  primary_onboarding_role?:
    | "buyer"
    | "seller"
    | "renter"
    | "agent"
    | "brokerage"
    | "integration_partner"
    | "investor";
  /** Shell-only onboarding scaffold; stripped from preferences API payload. */
  workspace_shell_test_input?: string;
  name?: string;
  pets?: string;
  age?: number;
  why_joining_silverkey?: string[];
  gender?: string;
  occupation?: string;
  marital_status?: string;
  children_count?: number;

  // Financial
  /** When true, user is paying cash (financing fields hidden in UI). */
  paying_cash?: boolean;
  gross_income?: number;
  home_budget_min?: number;
  home_budget_max?: number;
  credit_score_range?: string;
  down_payment?: number;
  ideal_zip_code?: string;

  // Housing
  preferred_housing_type?: string;
  preferred_bathrooms_min?: number;
  preferred_bedrooms_min?: number;
  preferred_bathrooms_max?: number;
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
  /** Server key `extended_buyer_preferences` (v1 JSON); merged on save. */
  buyerPreferenceExtensions?: BuyerPreferenceExtensions;

  // Communication
  communication_frequency?: string;
  preferred_contact_method?: string;
  information_detail_level?: string;
  has_buyers_agent?: string; // 'yes' | 'no'
  looking_for_buyers_agent?: boolean;

  // Buyer About Me (SIL-182) — flat form keys; persisted via buyer_about_me ext + comm prefs
  buyer_about_moving_with?: string[];
  buyer_about_kids_ages?: string;
  buyer_about_has_pets?: boolean;
  buyer_about_pet_types?: string[];
  buyer_about_move_motivation?: string;

  // Renter preferences (SIL-226)
  renter_budget_min?: number; // monthly rent min
  renter_budget_max?: number; // monthly rent max
  renter_move_in_timeline?: string; // e.g. "immediately" | "1_month" | "3_months" | "6_months"
  renter_household_size?: number;
  renter_has_pets?: boolean;
  renter_pet_types?: string[];
  renter_amenities?: string[]; // e.g. ["in_unit_laundry", "parking", "gym", "pet_friendly"]
  renter_preferred_areas?: string[];

  // Buyer Financing (SIL-182) — flat form keys; persisted via price_financing ext + user_financials
  lender_status?: string;
  lender_name?: string;
  want_lender_connection?: boolean;
  loan_type?: string;
  down_payment_band?: string;
  first_home?: string;
  max_monthly_payment?: number;
  rent_or_own?: string;
  need_to_sell_first?: string;
  move_timeline?: string;

  // Agent profile (only when user has agent role / primary_onboarding_role is agent)
  agent_physical_mailing_address?: string;
  agent_licensed_states?: string[];
  agent_license_types?: string[];
  agent_license_numbers?: string[];
  agent_license_expiration_dates?: string[];
  agent_mls_affiliations?: Record<string, unknown>[];
  agent_testimonials?: AgentTestimonial[];
  agent_brokerage_name?: string;
  agent_brokerage_bic_name?: string;
  agent_brokerage_address?: string;
  agent_brokerage_email?: string;
  agent_brokerage_phone?: string;
  agent_bio?: string;
  agent_primary_service_zips?: string[];
  agent_specialties?: string[];
  agent_social_links?: Record<string, string>;
  // Brokerage onboarding (MVP)
  brokerage_legal_business_name?: string;
  brokerage_dba_name?: string;
  brokerage_primary_admin_name?: string;
  brokerage_primary_admin_email?: string;
  brokerage_primary_admin_phone?: string;
  brokerage_primary_admin_title?: string;
  brokerage_admin_is_broker_of_record?: boolean;

  brokerage_license_number?: string;
  brokerage_license_states?: string[];
  brokerage_broker_of_record_name?: string;
  brokerage_broker_of_record_license_number?: string;
  brokerage_agent_count?: number;
  brokerage_expected_monthly_users?: number;
  brokerage_primary_markets?: string[];
  brokerage_office_name?: string;
  brokerage_office_address?: string;
  brokerage_office_state?: string;
  brokerage_account_manager_name?: string;
  brokerage_account_manager_email?: string;
  brokerage_branch_name?: string;
  brokerage_branch_address?: string;
  brokerage_is_branch?: boolean;
  brokerage_is_subteam?: boolean;
  /** Server-assigned unique slug for `/a/{slug}`; read-only in forms (not submitted). */
  public_profile_slug?: string;
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

export type { ProfileStepId } from "./profileStepIds";

export type DropdownOption = {
  value: string;
  label: string;
};

export type ImportantLocation = NonNullable<OnboardingData["important_locations"]>[number];
