import React from "react";

import { Box } from "packages/ui/components/primitives";
import { BUTTON_ICON_SIZE_CLASS } from "packages/ui/styles/variants/buttonVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

type ButtonSize = "sm" | "md" | "lg";

/** Clone valid elements and append size class; wrap non-elements so icon never baseline-shifts. */
export function renderButtonIcon(
  icon: React.ReactNode,
  size: ButtonSize,
  textColorClass: string
): React.ReactNode {
  const iconClass = `${BUTTON_ICON_SIZE_CLASS[size]} ${textColorClass}`.trim();
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    const existingClassName = (icon.props as { className?: string })?.className ?? "";
    const className = twMergeClasses(existingClassName, iconClass);
    return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className,
    }) as React.ReactNode;
  }
  return (
    <Box className={`inline-flex flex-row items-center ${iconClass}`}>{icon}</Box>
  ) as React.ReactNode;
}
