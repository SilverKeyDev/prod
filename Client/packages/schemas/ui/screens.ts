export const SCREENS_PX = Object.freeze({
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const);

export type ScreenKey = keyof typeof SCREENS_PX;

function toPxNumber(value: string): number {
  // Tailwind screens are configured as px strings in this codebase.
  // Keep this intentionally strict; if config changes, adjust here.
  const trimmed = value.trim();
  if (!trimmed.endsWith("px")) return Number.NaN;
  return Number(trimmed.slice(0, -2));
}

export function screenPx(key: ScreenKey): number {
  return toPxNumber(SCREENS_PX[key]);
}

/**
 * `max-width` query for "below" a breakpoint, matching Tailwind's `md:hidden` semantics.
 * Example: `screenDown("md")` => `(max-width: 767.98px)`
 */
export function screenDown(key: ScreenKey): string {
  const px = screenPx(key);
  // Use a small epsilon so `md` means strictly below 768px.
  const max = Number.isFinite(px) ? px - 0.02 : px;
  return `(max-width: ${max}px)`;
}

/**
 * `min-width` query for "at or above" a breakpoint.
 * Example: `screenUp("md")` => `(min-width: 768px)`
 */
export function screenUp(key: ScreenKey): string {
  return `(min-width: ${SCREENS_PX[key]})`;
}

