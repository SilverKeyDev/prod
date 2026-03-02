/**
 * Shared address formatting for use across features (e.g. messaging, search).
 * Kept in packages/utils to avoid cross-feature imports.
 */

/**
 * Converts a known SilverKey PDF filename pattern to a readable address.
 * Accepts forms like:
 *   "<hash>_777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
 *   "777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
 */
export function formatFilenameToAddress(filename: string): string {
  if (!filename) return "";

  const cleanName = filename.replace(/\.[^.]+$/i, "");
  let parts = cleanName.split("_").filter(Boolean);

  if (parts.length === 0) return "";

  if (parts.length > 0 && /^[0-9a-f]{10,}$/i.test(parts[0])) {
    parts = parts.slice(1);
  }

  if (parts.length < 3) return parts.join(" ");

  const last = parts[parts.length - 1];
  if (/^(USA|US|United|States|UnitedStates)$/i.test(last)) {
    parts = parts.slice(0, -1);
  }

  let zipIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d{5}(?:-\d{4})?$/.test(parts[i])) {
      zipIndex = i;
      break;
    }
  }

  let stateIndex = -1;
  const startSearch = zipIndex > -1 ? zipIndex - 1 : parts.length - 1;
  for (let i = startSearch; i >= 0; i--) {
    if (/^[A-Z]{2}$/.test(parts[i])) {
      stateIndex = i;
      break;
    }
  }

  if (stateIndex === -1) {
    return naiveJoin(parts);
  }

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

  let streetParts: string[] = [];
  let cityParts: string[] = [];

  if (streetEndIndex !== -1) {
    streetParts = parts.slice(0, streetEndIndex + 1);
    cityParts = parts.slice(streetEndIndex + 1, stateIndex);
  } else {
    const startsWithNumber = /^\d+[A-Za-z]?$/.test(parts[0]);
    const cutoff = startsWithNumber ? Math.min(4, stateIndex) : Math.min(3, stateIndex);
    streetParts = parts.slice(0, cutoff);
    cityParts = parts.slice(cutoff, stateIndex);
  }

  const state = parts[stateIndex];
  const zip = zipIndex === stateIndex + 1 ? parts[zipIndex] : undefined;
  const tail = zipIndex > -1 ? parts.slice(zipIndex + 1) : parts.slice(stateIndex + 1);

  const formatted: string[] = [];
  if (streetParts.length) formatted.push(streetParts.join(" "));
  if (cityParts.length) formatted.push(titleCase(cityParts.join(" ")));
  formatted.push(state);
  if (zip) formatted.push(zip);
  if (tail.length) formatted.push(tail.join(" "));

  return formatted.join(", ");
}

function naiveJoin(tokens: string[]): string {
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
