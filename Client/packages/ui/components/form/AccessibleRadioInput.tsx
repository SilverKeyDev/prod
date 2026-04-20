/* eslint-disable silverkey/no-primitive-components -- base implementation */
import React from "react";

export type AccessibleRadioInputProps = {
  /** Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN). */
  label?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "aria-label">;

/**
 * Radio input with unified label prop for accessibility.
 */
export default function AccessibleRadioInput({ label, ...props }: AccessibleRadioInputProps) {
  return <input type="radio" aria-label={label} {...props} />;
}
