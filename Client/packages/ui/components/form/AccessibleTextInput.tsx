/* eslint-disable silverkey/no-primitive-components -- base implementation */
import React from "react";

export type AccessibleTextInputProps = {
  /** Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN). */
  label?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "aria-label">;

/**
 * Text input with unified label prop for accessibility.
 * Use instead of passing aria-label to native text inputs in features/pages.
 */
export default function AccessibleTextInput({ label, ...props }: AccessibleTextInputProps) {
  return <input type="text" aria-label={label} {...props} />;
}
