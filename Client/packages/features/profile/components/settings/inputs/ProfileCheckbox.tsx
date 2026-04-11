import React from "react";

import OliveCheckbox from "packages/ui/components/form/OliveCheckbox";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

export type ProfileCheckboxProps = {
  /** Whether the component is in edit mode (interactive) or read-only */
  isEditMode: boolean;
  /** Current checked state */
  checked: boolean;
  /** Label text to display next to the checkbox */
  label: string;
  /** Callback when checkbox is toggled (only called in edit mode) */
  onToggle?: () => void;
  /** Optional additional className for the wrapper */
  className?: string;
  /** Text size for the label (default: "sm") */
  textSize?: "xs" | "sm" | "md" | "lg";
  /** Text color class for the label (default: "text-text-primary") */
  textColor?: string;
  /** Gap between checkbox and label (default: "gap-2") */
  gap?: "gap-1" | "gap-2" | "gap-3" | "gap-4";
};

/**
 * ProfileCheckbox - Reusable checkbox component for profile forms
 *
 * Displays a checkbox with a label in either edit mode (interactive with Pressable)
 * or read-only mode (static display).
 *
 * @example
 * ```tsx
 * <ProfileCheckbox
 *   isEditMode={isEditMode}
 *   checked={formData.paying_cash}
 *   label={FIELD_LABELS.PAYING_WITH_CASH}
 *   onToggle={() => updateField("paying_cash", !formData.paying_cash)}
 * />
 * ```
 */
export function ProfileCheckbox({
  isEditMode,
  checked,
  label,
  onToggle,
  className = "",
  textSize = "sm",
  textColor = "text-text-primary",
  gap = "gap-2",
}: ProfileCheckboxProps) {
  const content = (
    <>
      <OliveCheckbox checked={checked} />
      <BodyText size={textSize} className={textColor}>
        {label}
      </BodyText>
    </>
  );

  if (isEditMode && onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        className={`flex flex-row items-center ${gap} ${className}`}
        label={label}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Box className={`flex flex-row items-center ${gap} ${className}`}>
      {content}
    </Box>
  );
}
