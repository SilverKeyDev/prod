/**
 * Merged color tokens for TypeScript and `color()` helper.
 *
 * ## Consumption hierarchy
 * 1. **Semantic** — `text-primary`, `text-secondary`, `text-tertiary`, `background-base`, `primary`,
 *    `border-card`, etc.: prefer these in UI and Tailwind class names (`text-text-primary`, …).
 * 2. **Brand** — `brand.primary`, `brand.accent`, `brand.secondary`: marketing / product accents;
 *    map into semantic tokens where possible.
 * 3. **Palette** — `olive`, `brown`, `neutral`, `green`, …: raw ramps; use to define semantics,
 *    not directly in feature UI.
 * 4. **Legacy flat keys** — `navy`, `warm-stone`, `gray-brown`, `sidebar-gray`, `dark-green`:
 *    deprecated aliases (same values as semantic tokens); do not use in new code — use
 *    `text-text-primary`, `text-text-tertiary`, `text-text-secondary`, `background-sidebar`, palette.
 *
 * ## File split (`tokens/color/`)
 * - [foundation.json](./foundation.json) — system + brand + palette + legacy aliases.
 * - [features.json](./features.json) — SilverKey domain (`match`, `calendar.eventKind`).
 * Tailwind preset merges both so `theme("colors.match…")` and `color("calendar.eventKind…")` stay stable.
 */
import chartPaletteColors from "./chart-palette.json";
import featureColors from "./features.json";
import foundationColors from "./foundation.json";
import stateColors from "./state-colors.json";

export const colors = {
  ...foundationColors,
  ...featureColors,
  ...chartPaletteColors,
  ...stateColors,
} as Record<string, unknown>;

/** Dot-separated path accepted by `color()`, e.g. `"brand.accent"`. */
export type ColorPath = string;
