/**
 * @silverkey/design-tokens
 *
 * Single source of truth for design tokens (colors, spacing, typography, breakpoints).
 * Consumers must use token helpers or Tailwind theme; no literal hex or raw numeric
 * spacing in UI code (enforced by ESLint in design-system-consuming paths).
 */
export { breakpoint, color, spacingToken as spacing, spacingToken } from "./helpers";
export type { BreakpointName, ColorPath } from "./tokens";
export { colors, themeSpacing } from "./tokens";
export { breakpoints, fontFamily, fontSize, spacing as spacingMap } from "./tokens";
