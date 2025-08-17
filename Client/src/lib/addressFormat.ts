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
  } else {
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
    "St","Ave","Rd","Dr","Ln","Blvd","Way","Ct","Pl","Ter","Pkwy",
    "Street","Avenue","Road","Drive","Lane","Boulevard","Way","Court","Place","Terrace","Parkway","Trail","Cir","Circle","Hwy","Highway"
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
    const cutoff = startsWithNumber ? Math.min(4, stateIndex) : Math.min(3, stateIndex);
    streetParts = parts.slice(0, cutoff);
    cityParts = parts.slice(cutoff, stateIndex);
  }

  const state = parts[stateIndex];
  const zip = zipIndex === stateIndex + 1 ? parts[zipIndex] : undefined;
  const tail = zipIndex > -1 ? parts.slice(zipIndex + 1) : parts.slice(stateIndex + 1); // country already removed

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
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/**
 * Truncate without chopping mid-word when possible.
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength - 3);
  const cut = slice.lastIndexOf(" ");
  return (cut > 0 ? slice.slice(0, cut) : slice) + "...";
}

/**
 * Formats a date string to "MMM D, YYYY".
 * Returns the original string if parsing fails.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Formats a price with currency formatting.
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
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
    case 'recently_sold':
      return 'bg-green-100 text-green-800';
    case 'for_sale':
      return 'bg-blue-100 text-blue-800';
    case 'off_market':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Formats home status text (converts underscores to spaces and title cases).
 */
export function formatHomeStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats agent name to title case.
 */
export function formatAgentName(name: string): string {
  return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats lot size with proper decimal places.
 * Acres: 2 decimal places, Square footage: 0 decimal places.
 */
export function formatLotSize(value: number, units: string): string {
  if (units?.toLowerCase().includes('acre')) {
    return `${value.toFixed(2)} ${units.toLowerCase()}`;
  } else {
    return `${Math.round(value).toLocaleString()} ${units?.toLowerCase() || 'sqft'}`;
  }
}
