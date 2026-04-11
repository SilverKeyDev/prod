/**
 * Color tokens - single source of truth.
 * All hex/hsl values live in colors.json. This file re-exports for TypeScript.
 * Consumers must use color() helper or Tailwind theme classes.
 */
import colorsData from "./colors.json";

export const colors = colorsData as Record<string, unknown>;

export type ColorPath = keyof typeof colors | (string & Record<never, never>);
