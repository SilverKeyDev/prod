/**
 * Detects IDs that are almost certainly app/database keys (favorite row UUIDs, etc.),
 * not Slipstream/MLS listing identifiers. Used so property research falls back to
 * address-only lookup instead of calling /ws/listings/get with a useless id.
 */
const RFC4122_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLikelyInternalAppListingKey(id: string): boolean {
  const s = id.trim();
  if (s === "") return false;
  const lower = s.toLowerCase();
  if (lower.startsWith("fav-") || lower.startsWith("temp_")) {
    return true;
  }
  return RFC4122_UUID.test(s);
}
