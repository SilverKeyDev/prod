/**
 * Listing lat/lng for property details maps (shared by web + native map sections).
 */
export type ListingCoordsInput = {
  lat?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  /** OpenAPI / normalized property shape */
  location?: unknown;
  /** Raw Slipstream-style envelope */
  coordinates?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseCoordComponent(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return Number.NaN;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
}

/**
 * First usable coordinate among candidates. Skips `0` so UI placeholders (`lat`/`lng` often
 * initialized to 0) do not hide real values on `latitude`/`longitude` or nested `location`.
 */
function firstFiniteNonPlaceholderCoord(...candidates: unknown[]): number {
  for (const c of candidates) {
    const n = parseCoordComponent(c);
    if (Number.isFinite(n) && n !== 0) return n;
  }
  return Number.NaN;
}

/**
 * Resolve lat/lng from `property.coordinates` (Slipstream / detail), then top-level fields, then
 * `property.location` (OpenAPI). `coordinates` is checked first so real geometry is not masked by
 * search-result placeholders (`lat`/`latitude` often0 before the stream merges).
 */
function resolveRawLatLng(property: ListingCoordsInput | Record<string, unknown>): {
  rawLat: number;
  rawLng: number;
} {
  const p = property as Record<string, unknown>;
  const loc = asRecord(p.location);
  const coords = asRecord(p.coordinates);

  const rawLat = firstFiniteNonPlaceholderCoord(
    coords?.lat,
    coords?.latitude,
    p.lat,
    p.latitude,
    loc?.lat,
    loc?.latitude
  );
  const rawLng = firstFiniteNonPlaceholderCoord(
    coords?.lng,
    coords?.longitude,
    p.lng,
    p.longitude,
    loc?.lng,
    loc?.longitude
  );
  return { rawLat, rawLng };
}

export function getListingCoords(
  property: ListingCoordsInput | Record<string, unknown>
): { lat: number; lng: number } | null {
  const { rawLat, rawLng } = resolveRawLatLng(property);
  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng) || (rawLat === 0 && rawLng === 0)) {
    return null;
  }
  return { lat: rawLat, lng: rawLng };
}

/** `typeof` / nullish label for a coordinate source field (no raw values — avoids noisy or sensitive dumps). */
function coordFieldKind(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const t = typeof value;
  if (t === "number" || t === "string") return t;
  return t;
}

export type ListingCoordsUnavailableDiagnostics = {
  reason:
    | "missing_or_invalid_lat_and_lng"
    | "missing_or_invalid_lat"
    | "missing_or_invalid_lng"
    | "rejected_placeholder_zero_zero";
  parsedLat: number;
  parsedLng: number;
  /** False when {@link parsedLat} is NaN (JSON logs show null for NaN). */
  parsedLatFinite: boolean;
  /** False when {@link parsedLng} is NaN (JSON logs show null for NaN). */
  parsedLngFinite: boolean;
  /** Why resolution failed without echoing raw coordinates. */
  resolutionNote?: string;
  fields: {
    lat: string;
    latitude: string;
    lng: string;
    longitude: string;
  };
};

/**
 * When {@link getListingCoords} returns null, describes why (for support / telemetry logging).
 * Returns null if coordinates are usable.
 */
export function getListingCoordsUnavailableDiagnostics(
  property: ListingCoordsInput | Record<string, unknown>
): ListingCoordsUnavailableDiagnostics | null {
  if (getListingCoords(property) !== null) return null;

  const { rawLat, rawLng } = resolveRawLatLng(property);
  const latOk = Number.isFinite(rawLat);
  const lngOk = Number.isFinite(rawLng);

  let reason: ListingCoordsUnavailableDiagnostics["reason"];
  if (latOk && lngOk && rawLat === 0 && rawLng === 0) {
    reason = "rejected_placeholder_zero_zero";
  } else if (!latOk && !lngOk) {
    reason = "missing_or_invalid_lat_and_lng";
  } else if (!latOk) {
    reason = "missing_or_invalid_lat";
  } else {
    reason = "missing_or_invalid_lng";
  }

  const p = property as Record<string, unknown>;

  let resolutionNote: string | undefined;
  if (!latOk && !lngOk) {
    const nz = (k: keyof typeof p) => p[k] === 0;
    if (nz("lat") && nz("latitude") && nz("lng") && nz("longitude")) {
      resolutionNote =
        "all_top_level_lat_lng_latitude_longitude_are_zero_skipped_need_nested_location_or_stream_basic";
    } else if (
      nz("lat") &&
      nz("lng") &&
      (p.latitude === undefined || p.latitude === null) &&
      (p.longitude === undefined || p.longitude === null)
    ) {
      resolutionNote = "lat_lng_zero_no_latitude_longitude_fallback";
    }
  }

  return {
    reason,
    parsedLat: rawLat,
    parsedLng: rawLng,
    parsedLatFinite: latOk,
    parsedLngFinite: lngOk,
    resolutionNote,
    fields: {
      lat: coordFieldKind(p.lat),
      latitude: coordFieldKind(p.latitude),
      lng: coordFieldKind(p.lng),
      longitude: coordFieldKind(p.longitude),
    },
  };
}
