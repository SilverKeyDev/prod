/** Allow only hex colors for SVG/CSS injection guards. */
const HEX_COLOR_RE = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export function sanitizeCssHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
}
