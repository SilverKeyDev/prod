import type React from "react";

/**
 * Minimal cross-platform Button API. Web extends with HTML button attrs;
 * native extends with PressableProps. Use onPress for cross-platform handlers.
 */
export type ButtonPropsBase = {
  children?: React.ReactNode;
  /** Cross-platform press/click; web maps to onClick. */
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: unknown;
  /** Maps to aria-label (web) / accessibilityLabel (native). */
  label?: string;
};
