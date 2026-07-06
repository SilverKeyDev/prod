// Required fields mapping - used to determine if a field needs RequiredLabel or OptionalLabel
// Base required fields for onboarding (only About You / agent fields required; housing/location optional)
export const REQUIRED_FIELDS_ONBOARDING: Record<string, boolean> = {
  // Demographics (legacy agent path)
  name: false,
  age: false,
  why_joining_silverkey: false,
  marital_status: false,
  children_count: false,

  // Buyer About Me (SIL-182) — validated via buyerStepValidation when role is buyer
  buyer_about_moving_with: false,
  buyer_about_kids_ages: false,
  buyer_about_has_pets: false,
  buyer_about_pet_types: false,
  buyer_about_move_motivation: false,
  preferred_contact_method: false,

  // Buyer Financing (SIL-182)
  lender_status: false,
  lender_name: false,
  want_lender_connection: false,
  loan_type: false,
  down_payment_band: false,
  first_home: false,
  max_monthly_payment: false,
  rent_or_own: false,
  need_to_sell_first: false,
  move_timeline: false,
  paying_cash: false,
  gross_income: false,
  home_budget_min: false,
  home_budget_max: false,
  down_payment: false,
  credit_score_range: false,
  ideal_zip_code: false,

  // Housing
  preferred_housing_type: false,
  preferred_bedrooms_min: false,
  preferred_bathrooms_min: false,
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
  age: false,
  why_joining_silverkey: false,
  gender: false,
  occupation: false,
  marital_status: false,
  children_count: false,

  // Financial
  paying_cash: false,
  gross_income: false,
  home_budget_min: false,
  home_budget_max: false,
  down_payment: false,
  credit_score_range: false,
  ideal_zip_code: false,

  // Housing
  preferred_housing_type: false,
  preferred_bedrooms_min: false,
  preferred_bathrooms_min: false,
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

/** Required fields for mobile onboarding. Kept in sync with web (REQUIRED_FIELDS_ONBOARDING). */
export const REQUIRED_FIELDS_ONBOARDING_MOBILE: Record<string, boolean> = {
  ...REQUIRED_FIELDS_ONBOARDING,
};
