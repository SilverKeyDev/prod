/// <reference types="nativewind/types" />

import React, { forwardRef } from "react";

// import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { Icon } from "@ui/icons";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import RippleBackground from "packages/ui/components/backgrounds/RippleBackground";
import { Box } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";

type IconButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "toolbar";

type IconButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "small" | "medium" | "large";

type IconButtonOwnProps = {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconName?: IconName;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  hoverBg?: "gray-50" | "gray-100" | "gray-200";
  activeBg?: "gray-100" | "gray-200" | "gray-300";
  label?: string;
};

export type IconButtonProps = IconButtonOwnProps &
  Omit<PressableProps, keyof IconButtonOwnProps | "accessibilityLabel"> & {
    onClick?: () => void;
    className?: string;
  };

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  xs: "min-h-7 min-w-7",
  sm: "min-h-8 min-w-8",
  md: "min-h-9 min-w-9",
  lg: "min-h-10 min-w-10",
  xl: "min-h-11 min-w-11",
  small: "min-h-6 min-w-6",
  medium: "min-h-7 min-w-7",
  large: "min-h-8 min-w-8",
};

const ROUNDED_CLASSES: Record<NonNullable<IconButtonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "border border-border bg-neutral-200",
  tertiary: "border-2 border-black bg-accent disabled:border-neutral-400",
  outline: "border border-primary bg-transparent",
  ghost: "bg-transparent",
  danger: "bg-destructive",
  toolbar: "bg-transparent",
};

const PRESSABLE_FORWARD_KEYS = [
  "testID",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "nativeID",
] as const;

function pickPressableProps(props: Record<string, unknown>): Partial<PressableProps> {
  const result: Record<string, unknown> = {};
  for (const key of PRESSABLE_FORWARD_KEYS) {
    if (key in props && props[key] !== undefined) {
      result[key] = props[key];
    }
  }
  return result as Partial<PressableProps>;
}

/**
 * Native IconButton — Pressable with icon and variant/size styling.
 * Avoids DOM <button> so React Native does not throw "View config getter for component button".
 */
const IconButton = forwardRef<React.ElementRef<typeof Pressable>, IconButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      rounded = "lg",
      disabled,
      label,
      onPress,
      onClick,
      className = "",
      ...rest
    },
    ref
  ) => {
    const sizeClass = SIZE_CLASSES[size];
    const roundedClass = ROUNDED_CLASSES[rounded];
    const variantClass = VARIANT_CLASSES[variant];
    const resolvedIcon = icon ?? (iconName ? <Icon name={iconName} size={20} /> : null);
    const handlePress = onPress ?? onClick;
    const pressableProps = pickPressableProps(rest);

    const content = loading ? (
      <>
        <RippleBackground overlay />
        <Box className="relative z-10 items-center justify-center">
          {/* <KeyTurnLoader message="" /> */}
        </Box>
      </>
    ) : (
      resolvedIcon
    );

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled ?? loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={`items-center justify-center ${variantClass} ${sizeClass} ${roundedClass} ${loading ? "overflow-hidden border-2 border-neutral-600" : ""} ${""} ${className}`}
        {...pressableProps}
      >
        {content}
      </Pressable>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
