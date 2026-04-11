/**
 * Canonical source of truth for property details section order.
 * This constant defines both the type and the runtime order for sections,
 * ensuring consistency across tabs, scroll behavior, and section rendering.
 */
export const PROPERTY_DETAILS_SECTION_ORDER = [
  "overview",
  "location",
  "match",
  "analysis",
] as const;

/**
 * Property details section identifier.
 * Derived from PROPERTY_DETAILS_SECTION_ORDER to ensure type safety.
 */
export type PropertyDetailsSectionId =
  (typeof PROPERTY_DETAILS_SECTION_ORDER)[number];
