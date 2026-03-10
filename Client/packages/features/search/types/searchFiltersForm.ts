/**
 * Form data shape for search filters (criteria). Used by SearchFiltersContent and SearchFiltersSheet.
 * Mirrors the subset of user preferences fields used by search; avoids importing from profile feature.
 */
export type SearchFiltersFormData = {
  home_budget_min?: number;
  home_budget_max?: number;
  preferred_bedrooms?: number;
  preferred_bedrooms_max?: number;
  preferred_bathrooms?: number;
  preferred_bathrooms_max?: number;
  preferred_housing_type?: string;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  renovation_preference?: string;
  intended_property_use?: string;
  walkability_importance?: string;
  [key: string]: unknown;
};
