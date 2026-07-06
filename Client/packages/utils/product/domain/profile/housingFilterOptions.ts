/**
 * Canonical option lists for housing/search preference fields stored as UserIntentAttribute keys:
 * - `renovation_preference` → RENOVATION_PREFERENCE_OPTIONS
 * - `intended_property_use` → INTENDED_PROPERTY_USE_OPTIONS
 *
 * Profile settings, onboarding, and search filters must import from this module (not dropdownOptions.ts).
 */

export const ARCHITECTURAL_STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "colonial", label: "Colonial" },
  { value: "ranch", label: "Ranch" },
  { value: "craftsman", label: "Craftsman" },
  { value: "victorian", label: "Victorian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "contemporary", label: "Contemporary" },
] as const;

/** Canonical values for `renovation_preference` (matches server negotiation strategy_model). */
export const RENOVATION_PREFERENCE_OPTIONS = [
  { value: "none", label: "None - Move-in Ready" },
  { value: "minor", label: "Minor Cosmetic Updates" },
  { value: "major", label: "Major Renovations" },
  { value: "complete", label: "Complete Renovation" },
] as const;

/** Canonical values for `intended_property_use`. */
export const INTENDED_PROPERTY_USE_OPTIONS = [
  { value: "primary", label: "Primary Residence" },
  { value: "investment", label: "Investment Property" },
  { value: "vacation", label: "Vacation Home" },
  { value: "rental", label: "Rental Property" },
  { value: "airbnb", label: "AirBnB" },
] as const;

/** Profile onboarding alias for {@link INTENDED_PROPERTY_USE_OPTIONS}. */
export const INTENDED_USE_OPTIONS = INTENDED_PROPERTY_USE_OPTIONS;

/** Search filter alias for {@link INTENDED_PROPERTY_USE_OPTIONS}. */
export const PROPERTY_USE_OPTIONS = INTENDED_PROPERTY_USE_OPTIONS;

/** Search/profile filter walkability (3 values). Profile-only WALKABILITY_OPTIONS in dropdownOptions.ts differs. */
export const WALKABILITY_FILTER_OPTIONS = [
  { value: "very_important", label: "Very Important" },
  { value: "somewhat_important", label: "Somewhat Important" },
  { value: "not_important", label: "Not Important" },
] as const;
