/**
 * Turns backend / S3 folder slugs (e.g. `Buyer_broker_agreements`) into readable titles.
 */
export function formatFormsLibraryCategoryLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return raw;
  }

  const spaced = trimmed.replace(/_/g, " ").replace(/\s+/g, " ").trim();

  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
