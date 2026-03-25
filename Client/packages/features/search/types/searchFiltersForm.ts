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
  /** Legacy categorical; cleared when using acre range sliders */
  preferred_lot_size?: string;
  /** Legacy categorical; cleared when using age range sliders */
  preferred_home_age?: string;
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
  preferred_architectural_style?: string;
  renovation_preference?: string;
  intended_property_use?: string;
  walkability_importance?: string;
  [key: string]: unknown;
};
