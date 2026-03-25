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
