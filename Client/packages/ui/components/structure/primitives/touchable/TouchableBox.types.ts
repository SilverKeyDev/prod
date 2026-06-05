import type { ReactNode } from "react";

import type { HitSlopValue } from "packages/ui/constants/touch";

/**
 * Interaction style classes for hover (web) and pressed (native) states.
 * base: always applied. hover: applied on hover (web). pressed: applied when pressed.
 */
export type InteractionStyles = {
  base?: string;
  hover?: string;
  pressed?: string;
};

/**
 * Cross-platform touchable box props
 */
export interface TouchableBoxProps {
  children?: ReactNode;
  /** Primary press/tap handler */
  onPress?: () => void;
  /** Called when press starts */
  onPressIn?: () => void;
  /** Called when press ends */
  onPressOut?: () => void;
  /** Called on long press (500ms threshold) */
  onLongPress?: () => void;
  /** Disable all interactions */
  disabled?: boolean;
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (native).
   * Prefer over aria-label/accessibilityLabel in feature code.
   */
  label?: string;
  /** CSS classes (web) or NativeWind classes (native) */
  className?: string;
  /** Inline styles */
  style?: Record<string, unknown>;
  /**
   * Interaction state classes. Web: base + hover: + active:. Native: base + pressed when pressed.
   */
  interactionStyles?: InteractionStyles;
  /**
   * Hit slop to expand touch area. "default" (12pt), "small" (8pt), number, or custom object.
   * Applied on native only; web ignores.
   */
  hitSlop?: HitSlopValue;
  /** Additional props passed to underlying element */
  [key: string]: unknown;
}
