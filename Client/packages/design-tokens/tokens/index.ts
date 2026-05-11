/**
 * Design token barrel — domain folders under `tokens/`:
 * - `color/` — merged palette JSON + `colors` export
 * - `motion/` — transition duration / easing (JSON + TS)
 * - `typography/` — font family + fontSize JSON (shared with Tailwind)
 * - `layout/` — breakpoints, spacing scale, z-index layers
 * - `effects/` — cross-platform shadow token structs
 */
export { type ColorPath, colors } from "./color";
export {
  shadowCard,
  shadowElevated,
  shadowSubtle,
  type ShadowToken,
  type ShadowTokenName,
  shadowTokens,
} from "./effects/shadows";
export { type BreakpointName, breakpoints } from "./layout/breakpoints";
export { spacing, spacingScale, themeSpacing } from "./layout/spacing";
export { Z_LAYERS, type ZLayerName } from "./layout/zLayers";
export { motionDuration, motionEasing } from "./motion";
export { fontFamily, fontSize } from "./typography";
