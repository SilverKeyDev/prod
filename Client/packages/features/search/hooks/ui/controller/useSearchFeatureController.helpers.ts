/**
 * Pure helper for search UX that depends on saved important locations.
 */
export function userPreferencesHasImportantLocations(important_locations: unknown): boolean {
  return Array.isArray(important_locations) && important_locations.length > 0;
}
