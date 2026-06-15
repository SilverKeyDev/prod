import React from "react";

import { OliveCheckbox } from "packages/ui";
import { Pressable } from "packages/ui/components/structure/primitives";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type EditModeCheckboxProps = {
  isEditMode: boolean;
  checked: boolean;
  label: string;
  onToggle?: () => void;
  className?: string;
  textSize?: "xs" | "sm" | "md" | "lg";
  textColor?: string;
  gap?: "gap-1" | "gap-2" | "gap-3" | "gap-4";
};

export function EditModeCheckbox({
  isEditMode,
  checked,
  label,
  onToggle,
  className = "",
  textSize = "sm",
  textColor = "text-text-primary",
  gap = "gap-2",
}: EditModeCheckboxProps) {
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

  return <Box className={`flex flex-row items-center ${gap} ${className}`}>{content}</Box>;
}

/** @deprecated Use EditModeCheckbox */
export const ProfileCheckbox = EditModeCheckbox;
