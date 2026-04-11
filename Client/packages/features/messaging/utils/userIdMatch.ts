/**
 * Compare user identifiers from profile vs API (conversation rows).
 * Avoids empty UI when types differ (e.g. loose JSON typing) or casing differs on UUIDs.
 */
export function isSameMessagingUserId(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}
