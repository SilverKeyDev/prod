/**
 * TouchableBox primitive styles — single source of truth for web and native.
 * Platform files must import from here; they must NOT define local style strings.
 */

/** Disabled state — opacity and pointer-events (web); opacity only on native */
export const TOUCHABLE_DISABLED_CLASSES = "pointer-events-none opacity-50";
