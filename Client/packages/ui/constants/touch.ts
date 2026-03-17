/**
 * Hit slop types and utilities for touch targets.
 * Used by TouchableBox.native for expanding touch area on React Native.
 */

export type HitSlopValue =
  | "default"
  | "small"
  | number
  | { top?: number; bottom?: number; left?: number; right?: number };

export type HitSlop = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const DEFAULT_HIT_SLOP = 12;
const SMALL_HIT_SLOP = 8;

/**
 * Resolves HitSlopValue to a React Native hitSlop object.
 * - "default" → 12pt on all sides
 * - "small" → 8pt on all sides
 * - number → uniform value on all sides
 * - object → pass through with defaults for missing sides
 */
export function resolveHitSlop(value: HitSlopValue): HitSlop | undefined {
  if (value === "default") {
    return {
      top: DEFAULT_HIT_SLOP,
      bottom: DEFAULT_HIT_SLOP,
      left: DEFAULT_HIT_SLOP,
      right: DEFAULT_HIT_SLOP,
    };
  }
  if (value === "small") {
    return {
      top: SMALL_HIT_SLOP,
      bottom: SMALL_HIT_SLOP,
      left: SMALL_HIT_SLOP,
      right: SMALL_HIT_SLOP,
    };
  }
  if (typeof value === "number") {
    return {
      top: value,
      bottom: value,
      left: value,
      right: value,
    };
  }
  if (typeof value === "object" && value !== null) {
    return {
      top: value.top ?? 0,
      bottom: value.bottom ?? 0,
      left: value.left ?? 0,
      right: value.right ?? 0,
    };
  }
  return undefined;
}
