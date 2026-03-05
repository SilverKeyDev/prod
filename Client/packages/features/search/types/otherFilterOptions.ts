export const LOT_SIZE_OPTIONS = [
  { value: "small", label: "Small (under 0.25 acres)" },
  { value: "medium", label: "Medium (0.25 - 0.5 acres)" },
  { value: "large", label: "Large (0.5 - 1 acre)" },
  { value: "very_large", label: "Very Large (1+ acres)" },
] as const;

export const HOME_AGE_OPTIONS = [
  { value: "new", label: "New (0-5 years)" },
  { value: "recent", label: "Recent (5-15 years)" },
  { value: "established", label: "Established (15-30 years)" },
  { value: "mature", label: "Mature (30-50 years)" },
  { value: "historic", label: "Historic (50+ years)" },
] as const;

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

export const RENOVATION_OPTIONS = [
  { value: "none", label: "None - Move-in Ready" },
  { value: "minor", label: "Minor Cosmetic Updates" },
  { value: "major", label: "Major Renovations" },
  { value: "complete", label: "Complete Renovation" },
] as const;

export const PROPERTY_USE_OPTIONS = [
  { value: "primary", label: "Primary Residence" },
  { value: "investment", label: "Investment Property" },
  { value: "vacation", label: "Vacation Home" },
  { value: "rental", label: "Rental Property" },
  { value: "airbnb", label: "AirBnB" },
] as const;

export const WALKABILITY_OPTIONS = [
  { value: "very_important", label: "Very Important" },
  { value: "somewhat_important", label: "Somewhat Important" },
  { value: "not_important", label: "Not Important" },
] as const;
