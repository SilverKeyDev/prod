/**
 * Move Concierge partner embed URL for checklist integration.
 *
 * Base path must stay `https://mc.partners/SilverKey`. Query keys below are an
 * educated guess for common marketing forms; confirm with Move Concierge and
 * adjust `QUERY_KEYS` if the live form uses different parameter names.
 */

export const MOVE_CONCIERGE_PARTNER_URL = "https://mc.partners/SilverKey";

/** Partner URL query parameter names (update when Move Concierge confirms). */
const QUERY_KEYS = {
  fullName: "name",
  email: "email",
  phone: "phone",
  newAddress: "address",
  city: "city",
  state: "state",
  zip: "zip",
  moveDate: "move_date",
  leadType: "type",
} as const;

export type MoveConciergePrefill = {
  fullName?: string;
  email?: string;
  phone?: string;
  newAddressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  moveDate?: string;
  /** e.g. "Home Buyer" for the partner form's type dropdown */
  leadType?: string;
};

function appendIfNonEmpty(params: URLSearchParams, key: string, value: string | undefined): void {
  const trimmed = value?.trim();
  if (trimmed) params.set(key, trimmed);
}

function parsePreferencesArrayField(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
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

function firstImportantLocationAddress(value: unknown): string | undefined {
  for (const item of parsePreferencesArrayField(value)) {
    if (item && typeof item === "object" && "address" in item) {
      const addr = (item as { address?: unknown }).address;
      if (typeof addr === "string" && addr.trim() !== "") return addr.trim();
    }
  }
  return undefined;
}

function firstPreferredRegionAddress(value: unknown): string | undefined {
  for (const item of parsePreferencesArrayField(value)) {
    if (item && typeof item === "object" && "address" in item) {
      const addr = (item as { address?: unknown }).address;
      if (typeof addr === "string" && addr.trim() !== "") return addr.trim();
    }
  }
  return undefined;
}

/**
 * Derives Move Concierge prefill fields from raw user preferences API shape
 * (no dependency on the profile feature module).
 */
export function prefillFromUserPreferencesRecord(
  prefs: Record<string, unknown> | null | undefined,
  options?: { authFullName?: string | null }
): MoveConciergePrefill {
  const authName =
    typeof options?.authFullName === "string" && options.authFullName.trim() !== ""
      ? options.authFullName.trim()
      : undefined;

  if (!prefs) {
    return {
      fullName: authName,
      leadType: "Home Buyer",
    };
  }

  const nameFromPrefs =
    typeof prefs.name === "string" && prefs.name.trim() !== "" ? prefs.name.trim() : undefined;

  const newAddressLine =
    firstImportantLocationAddress(prefs.important_locations) ??
    firstPreferredRegionAddress(prefs.preferred_regions);

  const iz = prefs.ideal_zip_code;
  const zipRaw = iz != null ? String(iz).trim() : "";
  const zip = zipRaw !== "" ? zipRaw : undefined;

  return {
    fullName: authName ?? nameFromPrefs,
    newAddressLine,
    zip,
    leadType: "Home Buyer",
  };
}

/**
 * Builds the iframe/WebView URL with optional prefill query parameters.
 * Omits empty or whitespace-only values.
 */
export function buildMoveConciergeEmbedUrl(prefill: MoveConciergePrefill): string {
  const params = new URLSearchParams();
  appendIfNonEmpty(params, QUERY_KEYS.fullName, prefill.fullName);
  appendIfNonEmpty(params, QUERY_KEYS.email, prefill.email);
  appendIfNonEmpty(params, QUERY_KEYS.phone, prefill.phone);
  appendIfNonEmpty(params, QUERY_KEYS.newAddress, prefill.newAddressLine);
  appendIfNonEmpty(params, QUERY_KEYS.city, prefill.city);
  appendIfNonEmpty(params, QUERY_KEYS.state, prefill.state);
  appendIfNonEmpty(params, QUERY_KEYS.zip, prefill.zip);
  appendIfNonEmpty(params, QUERY_KEYS.moveDate, prefill.moveDate);
  appendIfNonEmpty(params, QUERY_KEYS.leadType, prefill.leadType);

  const qs = params.toString();
  return qs ? `${MOVE_CONCIERGE_PARTNER_URL}?${qs}` : MOVE_CONCIERGE_PARTNER_URL;
}
