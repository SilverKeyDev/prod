/* eslint-disable silverkey/no-primitive-components -- base implementation */
import React from "react";

export type AccessibleCheckboxInputProps = {
  /** Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN). */
  label?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "aria-label">;

/**
 * Checkbox input with unified label prop for accessibility.
 * Use instead of passing aria-label to native checkbox inputs in features/pages.
 */
export default function AccessibleCheckboxInput({ label, ...props }: AccessibleCheckboxInputProps) {
  return <input type="checkbox" aria-label={label} {...props} />;
}
