import { isLikelyInternalAppListingKey } from "./listingIdentifier";
import { buildPropertyUrl } from "./slug";

export type ResearchListingKeyInput = {
  id: string;
  zpid?: string | number;
  mls_home_id?: string;
  mlsid?: string;
};

/**
 * Listing id for research / Slipstream (`PropertyRequest.zpid` carries the provider listing id).
 * Prefer `zpid` when present; then MLS ids; then `id` if not an internal app key (UUID, fav-, etc.).
 * Address-only fallback often fails Slipstream with "Missing parameter: id".
 */
export function researchListingZpid(property: ResearchListingKeyInput): string | undefined {
  if (typeof property.zpid === "string") {
    const s = property.zpid.trim();
    if (s !== "" && !isLikelyInternalAppListingKey(s)) return s;
  }
  if (typeof property.zpid === "number" && Number.isFinite(property.zpid)) {
    return String(Math.trunc(property.zpid));
  }
  for (const raw of [property.mls_home_id, property.mlsid]) {
    if (typeof raw === "string") {
      const s = raw.trim();
      if (s !== "" && !isLikelyInternalAppListingKey(s)) return s;
    }
  }
  if (typeof property.id === "string") {
    const id = property.id.trim();
    if (id !== "" && !isLikelyInternalAppListingKey(id)) return id;
  }
  return undefined;
}

/** `/property/:listingKey/:slug` or null when no provider listing key (e.g. UUID-only saved row). */
export function propertyDetailsPathFromListing(
  property: ResearchListingKeyInput & { address: string }
): string | null {
  const key = researchListingZpid(property);
  if (!key) return null;
  try {
    return buildPropertyUrl(key, property.address);
  } catch {
    return null;
  }
}
