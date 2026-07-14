import { color } from "packages/design-tokens";

/** Union isochrone veil: sage fill vs olive stroke (slightly stronger for map contrast). */
const ISOCHRONE_UNION_FILL_HEX = color("olive.muted") || "#E4EBE4";
const ISOCHRONE_UNION_FILL_OPACITY = 0.48;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

/** Google Maps `Polygon` options: light base tint + readable opacity. */
export function getIsochroneUnionFillForGoogleMaps(): {
  fillColor: string;
  fillOpacity: number;
} {
  return { fillColor: ISOCHRONE_UNION_FILL_HEX, fillOpacity: ISOCHRONE_UNION_FILL_OPACITY };
}

/** react-native-maps `Polygon` `fillColor` string aligned with web. */
export function getIsochroneUnionFillNativeRgba(): string {
  const rgb = hexToRgb(ISOCHRONE_UNION_FILL_HEX);
  if (!rgb) {
    return `rgba(228, 235, 228, ${ISOCHRONE_UNION_FILL_OPACITY})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ISOCHRONE_UNION_FILL_OPACITY})`;
}
