import React from "react";

import { Icon } from "@ui/icons";

import { Text } from "packages/ui/components/primitives";
import {
  BUTTON_ICON_SIZE_CLASS,
  BUTTON_TEXT_COLOR_CLASSES,
  BUTTON_TEXT_SIZE_CLASSES,
  type ButtonStyleVariant,
} from "packages/ui/styles/variants/buttonVariants";
import type { IconName } from "packages/ui/types/icons";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

import type { ButtonVariant } from "./buttonTypes";

/** Optional composition: platform-resolved icon with button label color tokens. */
export function ButtonIcon({
  name,
  size = "md",
  variant = "primary",
  className,
}: {
  name: IconName;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariant;
  className?: string;
}) {
  const effectiveVariant: ButtonStyleVariant = variant === "cancel" ? "ghost" : variant;
  const textColorClass = BUTTON_TEXT_COLOR_CLASSES[effectiveVariant];
  return (
    <Icon
      name={name}
      className={twMergeClasses(BUTTON_ICON_SIZE_CLASS[size], textColorClass, className)}
    />
  );
}

ButtonIcon.displayName = "Button.Icon";

/** Optional composition: string label with button text size + color tokens. */
export function ButtonLabel({
  children,
  size = "md",
  variant = "primary",
  className,
}: {
  children: string;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariant;
  className?: string;
}) {
  const effectiveVariant: ButtonStyleVariant = variant === "cancel" ? "ghost" : variant;
  return (
    <Text
      className={twMergeClasses(
        BUTTON_TEXT_SIZE_CLASSES[size],
        BUTTON_TEXT_COLOR_CLASSES[effectiveVariant],
        "font-medium leading-none",
        className
      )}
    >
      {children}
    </Text>
  );
}

ButtonLabel.displayName = "Button.Label";
