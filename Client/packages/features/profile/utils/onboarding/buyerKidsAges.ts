/** Parse persisted kids_ages string (e.g. "8, 12" or "8 and 12") into tag values. */
export function parseKidsAgesString(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Serialize tag values back to the API string format. */
export function serializeKidsAgesTags(tags: string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}
