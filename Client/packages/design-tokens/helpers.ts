import { type BreakpointName, breakpoints } from "./tokens/breakpoints";
import { colors } from "./tokens/colors";
import { spacing } from "./tokens/spacing";

/**
 * Resolve a spacing value by key. Use Tailwind spacing keys (0, 1, 2, 2.5, 4, etc.)
 * or semantic keys (touch-sm, touch-md, safe-top, etc.).
 */
export function spacingToken(key: keyof typeof spacing | number): string {
  if (typeof key === "number") {
    const value = spacing[key as keyof typeof spacing];
    if (value !== undefined) return value;
    return `${key * 0.25}rem`;
  }
  return spacing[key] ?? "";
}

/**
 * Resolve a color by path, e.g. color("brand.accent"), color("neutral.500").
 * For inline styles use this; prefer Tailwind classes (e.g. text-brand-accent) when possible.
 */
export function color(path: string): string {
  const parts = path.split(".");
  let current: unknown = colors;
  for (const part of parts) {
    if (current === null || current === undefined) return "";
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : "";
}

/**
 * Resolve a breakpoint value by name, e.g. breakpoint("md") => "768px".
 */
export function breakpoint(name: BreakpointName): string {
  return breakpoints[name];
}
