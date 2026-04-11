/** Parse stored preferred_housing_type (comma-separated) into array for multiselect UI. */
export function parseHousingTypes(s: string | undefined): string[] {
  if (!s || typeof s !== "string") return [];
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Serialize selected housing type values for storage (comma-separated). */
export function serializeHousingTypes(arr: string[]): string {
  return arr.filter(Boolean).join(",");
}

/** Parse stored accessibility needs (comma-separated) into array for multiselect UI. */
export function parseAccessibilityNeeds(s: string | undefined): string[] {
  if (!s || typeof s !== "string") return [];
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Serialize selected accessibility needs for storage (comma-separated). */
export function serializeAccessibilityNeeds(arr: string[]): string | undefined {
  const serialized = arr
    .map((v) => v.trim())
    .filter(Boolean)
    .join(",");
  return serialized || undefined;
}
