/**
 * Map pin colors by listing / home status. Web pins combine match score (active listings)
 * with status-specific colors for pending, sold, rent, and off-market.
 */
import type { ScoreColors } from "./scoreColors";
import { getScoreBasedColorForMap } from "./scoreColors";

export type MapPinListingCategory =
  | "active"
  | "pending"
  | "sold"
  | "rent"
  | "off_market"
  | "unknown";

/** Hex colors aligned with web SVG pins (react-native-maps `pinColor`). */
export const MAP_PIN_STATUS_HEX = {
  activeUnfocused: "#737373",
  pending: "#E8C468",
  sold: "#9CA3AF",
  rent: "#5B8FC7",
  off_market: "#78716C",
} as const;

const MUTED_DARK_TEXT = "rgb(58, 58, 56)";
const MUTED_LIGHT_TEXT = "rgba(255, 255, 255, 0.92)";

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function hexToScoreColors(fillHex: string, strokeHex: string): ScoreColors {
  const parse = (h: string) => {
    const x = h.replace("#", "");
    return {
      r: parseInt(x.slice(0, 2), 16),
      g: parseInt(x.slice(2, 4), 16),
      b: parseInt(x.slice(4, 6), 16),
    };
  };
  const { r, g, b } = parse(fillHex);
  const lum = relativeLuminance(r, g, b);
  return {
    fillColor: fillHex,
    strokeColor: strokeHex,
    textColor: lum < 0.45 ? MUTED_LIGHT_TEXT : MUTED_DARK_TEXT,
  };
}

/**
 * Normalizes API strings (e.g. "For Sale", "FOR_SALE", "Pending") for map styling.
 */
export function categorizeListingStatusForMap(
  raw: string | undefined,
): MapPinListingCategory {
  if (raw == null || String(raw).trim() === "") {
    return "active";
  }
  const compact = String(raw).trim().toUpperCase().replace(/\s+/g, "_");

  if (
    compact.includes("PENDING") ||
    compact.includes("CONTINGENT") ||
    compact.includes("UNDER_CONTRACT") ||
    compact.includes("UNDER_CONTRACT_ESCROW")
  ) {
    return "pending";
  }
  if (compact.includes("SOLD") || compact.includes("RECENTLY_SOLD")) {
    return "sold";
  }
  if (compact.includes("RENT") || compact === "FOR_RENT") {
    return "rent";
  }
  if (
    compact.includes("OFF_MARKET") ||
    compact === "OFFMARKET" ||
    compact.includes("DELISTED")
  ) {
    return "off_market";
  }
  if (
    compact.includes("FOR_SALE") ||
    compact.includes("FORSALE") ||
    compact === "ACTIVE" ||
    compact.includes("COMING_SOON")
  ) {
    return "active";
  }
  if (compact.includes("SALE") && !compact.includes("RENT")) {
    return "active";
  }

  return "unknown";
}

/**
 * Pin fill/stroke for Advanced Marker: score gradient for active/unknown; fixed palette otherwise.
 */
export function getMapPinColorsForScoreAndStatus(
  score: number,
  listingStatus?: string,
  homeStatus?: string,
): ScoreColors {
  const raw = listingStatus ?? homeStatus;
  const category = categorizeListingStatusForMap(raw);

  if (category === "active" || category === "unknown") {
    return getScoreBasedColorForMap(score);
  }

  switch (category) {
    case "pending":
      return hexToScoreColors(MAP_PIN_STATUS_HEX.pending, "#B8942E");
    case "sold":
      return hexToScoreColors(MAP_PIN_STATUS_HEX.sold, "#6B7280");
    case "rent":
      return hexToScoreColors(MAP_PIN_STATUS_HEX.rent, "#3D6A9E");
    case "off_market":
      return hexToScoreColors(MAP_PIN_STATUS_HEX.off_market, "#57534E");
    default:
      return getScoreBasedColorForMap(score);
  }
}

export type NativeMapPinColorParams = {
  isFocused: boolean;
  listingStatus?: string;
  homeStatus?: string;
  /** Focused marker color (e.g. design token olive). */
  focusedColor: string;
  /** Non-focused color when status is active/unknown (previous default). */
  activeUnfocusedColor: string;
};

/**
 * Single marker color for react-native-maps default pin.
 */
export function getNativeMapPinColorHex(
  params: NativeMapPinColorParams,
): string {
  if (params.isFocused) {
    return params.focusedColor;
  }
  const category = categorizeListingStatusForMap(
    params.listingStatus ?? params.homeStatus,
  );
  switch (category) {
    case "pending":
      return MAP_PIN_STATUS_HEX.pending;
    case "sold":
      return MAP_PIN_STATUS_HEX.sold;
    case "rent":
      return MAP_PIN_STATUS_HEX.rent;
    case "off_market":
      return MAP_PIN_STATUS_HEX.off_market;
    case "active":
    case "unknown":
    default:
      return params.activeUnfocusedColor;
  }
}
