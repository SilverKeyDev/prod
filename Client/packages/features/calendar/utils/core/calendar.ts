import { color } from "packages/design-tokens";

/**
 * Fallback palette when API does not return backgroundColor.
 * Uses design tokens so border colors stay on-brand.
 */
function getCalendarColorPalette(): string[] {
  return [
    color("primary"),
    color("blue.DEFAULT"),
    color("accent"),
    color("destructive"),
    color("green.DEFAULT"),
    color("yellow.DEFAULT"),
    color("brown.DEFAULT"),
    color("neutral.600"),
  ];
}

/**
 * Build a map of calendar id -> border color for event chips.
 * Uses API backgroundColor when present (hex), otherwise design-token palette by index.
 */
export function getCalendarColorMap(
  calendars: Array<{ id: string; backgroundColor?: string }>
): Record<string, string> {
  const palette = getCalendarColorPalette();
  const map: Record<string, string> = {};
  calendars.forEach((cal, index) => {
    const fallback = palette[index % palette.length];
    const resolved =
      cal.backgroundColor && /^#[0-9A-Fa-f]{6}$/.test(cal.backgroundColor)
        ? cal.backgroundColor
        : fallback;
    map[cal.id] = resolved || fallback;
  });
  return map;
}
