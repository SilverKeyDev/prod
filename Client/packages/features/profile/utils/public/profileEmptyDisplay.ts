/** Shown when a profile field has no value (read-only and editable summary rows). */
export const PROFILE_NOT_SPECIFIED_LABEL = "Not specified" as const;

export function isProfileFieldEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/** Muted text for empty scalar fields (lighter than `text-text-primary`). */
export function profileFieldValueClassName(value: unknown): string {
  return isProfileFieldEmpty(value) ? "text-text-secondary" : "text-text-primary";
}

/** For min/max ranges: muted only when both ends are unset. */
export function profileRangeValueClassName(min: unknown, max: unknown): string {
  return min == null && max == null ? "text-text-secondary" : "text-text-primary";
}
