import { dateParseISO } from "packages/utils/date";

/**
 * Converts a known SilverKey PDF filename pattern to a readable address.
 * Accepts forms like:
 *   "<hash>_777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
 *   "777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
 *   "<hash>_123_Main_St_New_York_NY_10001.pdf"
 */
export function formatFilenameToAddress(filename: string): string {
  if (!filename) return "";

  // 1) strip extension (case-insensitive)
  const cleanName = filename.replace(/\.[^.]+$/i, "");

  // 2) split tokens
  let parts = cleanName.split("_").filter(Boolean);

  if (parts.length === 0) return "";

  // 3) drop leading hash-like prefix if present (e.g., "10421f3ef19c483a9")
  // Check for hexadecimal hash patterns (10+ characters, only 0-9 and a-f)
  if (parts.length > 0 && /^[0-9a-f]{10,}$/i.test(parts[0])) {
    parts = parts.slice(1);
  }

  if (parts.length < 3) return parts.join(" ");

  // 4) drop trailing country if present
  const last = parts[parts.length - 1];
  if (/^(USA|US|United|States|UnitedStates)$/i.test(last)) {
    parts = parts.slice(0, -1);
  }

  // 5) zip (5 or 5-4) expected near the end
  let zipIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d{5}(?:-\d{4})?$/.test(parts[i])) {
      zipIndex = i;
      break;
    }
  }

  // 6) state (2 uppercase letters) should be right before zip (if present) or near end
  let stateIndex = -1;
  const startSearch = zipIndex > -1 ? zipIndex - 1 : parts.length - 1;
  for (let i = startSearch; i >= 0; i--) {
    if (/^[A-Z]{2}$/.test(parts[i])) {
      stateIndex = i;
      break;
    }
  }

  // If no clear state token, fallback to simple spacing/commas
  if (stateIndex === -1) {
    return naiveJoin(parts);
  }

  // 7) street vs city split: find the last street suffix BEFORE the state
  const streetSuffixes = new Set([
    "St",
    "Ave",
    "Rd",
    "Dr",
    "Ln",
    "Blvd",
    "Way",
    "Ct",
    "Pl",
    "Ter",
    "Pkwy",
    "Street",
    "Avenue",
    "Road",
    "Drive",
    "Lane",
    "Boulevard",
    "Way",
    "Court",
    "Place",
    "Terrace",
    "Parkway",
    "Trail",
    "Cir",
    "Circle",
    "Hwy",
    "Highway",
  ]);

  let streetEndIndex = -1;
  for (let i = stateIndex - 1; i >= 0; i--) {
    if (streetSuffixes.has(parts[i])) {
      streetEndIndex = i;
      break;
    }
  }

  // If we didn’t find a suffix, try a soft heuristic: include tokens up to the first capitalized city-style token boundary
  let streetParts: string[] = [];
  let cityParts: string[] = [];

  if (streetEndIndex !== -1) {
    streetParts = parts.slice(0, streetEndIndex + 1);
    cityParts = parts.slice(streetEndIndex + 1, stateIndex);
  } else {
    // Soft guess: if address starts with a number, keep tokens until we hit something
    // that looks like a city start (usually after the number + a couple tokens).
    const startsWithNumber = /^\d+[A-Za-z]?$/.test(parts[0]);
    const cutoff = startsWithNumber
      ? Math.min(4, stateIndex)
      : Math.min(3, stateIndex);
    streetParts = parts.slice(0, cutoff);
    cityParts = parts.slice(cutoff, stateIndex);
  }

  const state = parts[stateIndex];
  const zip = zipIndex === stateIndex + 1 ? parts[zipIndex] : undefined;
  const tail =
    zipIndex > -1 ? parts.slice(zipIndex + 1) : parts.slice(stateIndex + 1); // country already removed

  const formatted: string[] = [];
  if (streetParts.length) formatted.push(streetParts.join(" "));
  if (cityParts.length) formatted.push(titleCase(cityParts.join(" ")));
  formatted.push(state);
  if (zip) formatted.push(zip);
  if (tail.length) formatted.push(tail.join(" "));

  return formatted.join(", ");
}

function naiveJoin(tokens: string[]): string {
  // Reasonable fallback: split in half with a comma
  if (tokens.length <= 3) return tokens.join(", ");
  const mid = Math.floor(tokens.length / 2);
  return `${tokens.slice(0, mid).join(" ")}, ${tokens.slice(mid).join(" ")}`;
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/**
 * Strips zip code, state, and country from an address for use in map marker titles.
 * Keeps street address and city only.
 */
/**
 * Street line only for compact property/home cards. Drops city, state, and ZIP
 * when the string uses the usual comma-separated US form ("Street, City, ST, ZIP").
 * For a single segment, strips a trailing "ST ZIP" suffix when present.
 */
export function addressStreetLineForCard(
  address: string | number | undefined | null,
): string {
  if (address == null) return "";
  const raw = typeof address === "number" ? String(address) : address;
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const segments = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length >= 2) {
    return segments[0] ?? trimmed;
  }

  const withoutStateZip = trimmed
    .replace(/,?\s+[A-Z]{2}\s*,?\s*\d{5}(?:-\d{4})?\s*$/i, "")
    .trim();
  if (withoutStateZip.length > 0 && withoutStateZip.length < trimmed.length) {
    return withoutStateZip;
  }

  return trimmed;
}

export function addressForMarkerTitle(address: string | undefined): string {
  if (!address || typeof address !== "string") return "";
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const filtered = parts.filter((part) => {
    // Zip code: 12345 or 12345-6789
    if (/^\d{5}(-\d{4})?$/.test(part)) return false;
    // State abbreviation: CA, NY, TX
    if (/^[A-Z]{2}$/.test(part)) return false;
    // State + Zip: CA 94043 or NY 10001-1234
    if (/^[A-Z]{2}\s+\d{5}(-\d{4})?$/.test(part)) return false;
    // Country
    if (/^(USA|US|United States|United States of America)$/i.test(part))
      return false;
    return true;
  });
  return filtered.join(", ").trim() || address;
}

/**
 * Truncate without chopping mid-word when possible.
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength - 3);
  const cut = slice.lastIndexOf(" ");
  return `${cut > 0 ? slice.slice(0, cut) : slice}...`;
}

/**
 * Formats a date string to "MMM D, YYYY".
 * Returns the original string if parsing fails.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = dateParseISO(dateString).toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats a price with currency formatting.
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats an address from structured address object.
 */
export function formatStructuredAddress(address: {
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
}): string {
  return `${address.streetAddress}, ${address.city}, ${address.state} ${address.zipcode}`;
}

/**
 * Gets status color classes for home status badges.
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "recently_sold":
      return "bg-green-100 text-green-800";
    case "for_sale":
      return "bg-blue-100 text-blue-800";
    case "off_market":
      return "bg-primary-muted text-text-primary";
    default:
      return "bg-primary-muted text-text-primary";
  }
}

/**
 * Formats home status text (converts underscores to spaces and title cases).
 */
export function formatHomeStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Formats agent name to title case.
 */
export function formatAgentName(name: string): string {
  return name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Formats lot size with proper decimal places.
 * Acres: 2 decimal places, Square footage: 0 decimal places.
 */
export function formatSquareFootage(value: number, units?: string): string {
  if (units?.toLowerCase().includes("acre")) {
    return `${value.toFixed(2)} ${units.toLowerCase()}`;
  } else {
    // Always round to integer and format with commas for consistency
    return `${Math.round(value).toLocaleString()} ${
      units?.toLowerCase() ?? "sqft"
    }`;
  }
}

/**
 * Formats lot size for display in acres.
 * - Numeric values and bare numbers (and strings with sq ft / sqft) are treated as square feet and converted to acres.
 * - Values already in acres are normalized to two decimal places with an "acres" suffix.
 */
export function formatLotSize(lotSize: string | number | undefined): string {
  if (lotSize === undefined || lotSize === null) return "N/A";
  const formatted = formatLotSizeInAcres(lotSize);
  return formatted ?? "N/A";
}

/**
 * Format lot size for display in acres.
 * Square feet (number, plain number string, or string containing sqft) → acres.
 * Returns null for zero/empty/invalid to allow callers to show a placeholder.
 */
export function formatLotSizeInAcres(lotSize: string | number): string | null {
  if (typeof lotSize === "number") {
    if (isNaN(lotSize) || lotSize <= 0) return null;
    const acres = lotSize / 43560;
    const formatted = formatSquareFootage(acres, "acres");
    if (formatted === "0.00 acres" || formatted === "0 acres") return null;
    return formatted;
  }

  const lotSizeStr = lotSize.trim();
  if (!lotSizeStr) return null;

  const lowerStr = lotSizeStr.toLowerCase();
  if (lowerStr.includes("acre")) {
    const acreValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
    if (isNaN(acreValue) || acreValue <= 0) return null;
    return formatSquareFootage(acreValue, "acres");
  }

  const numValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
  if (isNaN(numValue) || numValue <= 0) return null;
  const acres = numValue / 43560;
  const formatted = formatSquareFootage(acres, "acres");
  if (formatted === "0.00 acres" || formatted === "0 acres") return null;
  return formatted;
}
