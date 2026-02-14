import type { UserPreferences } from "../../../../../packages/schemas/user";

/**
 * Parses a user preference field that may be an array, JSON string, or undefined.
 * Returns an empty array if the value cannot be parsed or is not an array.
 */
export function parseUserPreferencesArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Parses multiple array fields from user preferences.
 * Useful for initializing form data with array fields.
 */
export function parseUserPreferencesArrays(
  userPreferences: UserPreferences | null | undefined,
  fields: Array<keyof UserPreferences>,
): Partial<Record<keyof UserPreferences, unknown[]>> {
  if (!userPreferences) {
    return {};
  }

  const result: Partial<Record<keyof UserPreferences, unknown[]>> = {};

  for (const field of fields) {
    result[field] = parseUserPreferencesArray(userPreferences[field]);
  }

  return result;
}
