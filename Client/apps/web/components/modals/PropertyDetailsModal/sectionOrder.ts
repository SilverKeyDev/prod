/**
 * Defines the fixed order of sections for PropertyDetailsModal.
 * 
 * The first few sections are always displayed in this order:
 * 1. PropertyDetails - Basic property information (year built, lot size, etc.)
 * 2. ProsAndCons - Pros and cons of the property
 * 3. PropertyFeatures - Property features and amenities
 * 
 * After these fixed sections, the remaining sections are ordered based on
 * the user's priorities (from userPreferences.report_section_priorities).
 */

export const FIXED_SECTION_ORDER = [
  "propertyDetails",
  "prosAndCons",
  "propertyFeatures",
] as const;

export type FixedSectionKey = (typeof FIXED_SECTION_ORDER)[number];

/**
 * Checks if a section key is in the fixed order (always shown first)
 */
export const isFixedSection = (key: string): key is FixedSectionKey => {
  return FIXED_SECTION_ORDER.includes(key as FixedSectionKey);
};

/**
 * Gets the priority index for a fixed section.
 * Returns -1 if the section is not in the fixed order.
 */
export const getFixedSectionPriority = (key: string): number => {
  const index = FIXED_SECTION_ORDER.indexOf(key as FixedSectionKey);
  return index >= 0 ? index : -1;
};
