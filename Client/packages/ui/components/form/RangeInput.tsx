/* eslint-disable silverkey/no-primitive-components -- base implementation */
import React from "react";

export type RangeInputProps = {
  /** Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN). */
  label?: string;
  /** No-op on web; on native, makes track transparent for overlay (e.g. dual-thumb). */
  transparentTrack?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Range input with unified label prop for accessibility.
 * Use instead of passing aria-label to native range inputs in features/pages.
 */
export default function RangeInput({
  label,
  transparentTrack: _transparentTrack,
  ...props
}: RangeInputProps) {
  return <input type="range" aria-label={label} {...props} />;
}
