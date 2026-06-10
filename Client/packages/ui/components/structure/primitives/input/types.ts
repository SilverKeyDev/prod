import type { ReactNode } from "react";

/**
 * Shared base props for Input (TextInput) primitive (web and native).
 * Normalizes change events: use onValueChange (string) instead of
 * web onChange (event) or native onChangeText (string).
 */
export type InputPropsBase = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  editable?: boolean;
  /** Unified change handler: receives the current string value. */
  onValueChange?: (text: string) => void;
  /**
   * Unified accessibility label. Prefer this over accessibilityLabel/aria-label in feature code.
   * Maps to aria-label (web) and accessibilityLabel (native).
   */
  label?: string;
  /** @internal Prefer `label` in feature code. Maps to aria-label / accessibilityLabel. */
  accessibilityLabel?: string;
  className?: string;
  children?: ReactNode;
  /** Web: multiline uses textarea. */
  multiline?: boolean;
};

export type InputProps = InputPropsBase;
