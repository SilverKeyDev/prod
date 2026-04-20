/// <reference types="nativewind/types" />
import React, { forwardRef } from "react";

// import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { Icon } from "@ui/icons";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import RippleBackground from "packages/ui/components/backgrounds/RippleBackground";
import { Box, Text } from "packages/ui/components/primitives";
import {
  BUTTON_LOADING_FRAME_CLASSES,
  BUTTON_LOADING_VARIANT_OVERRIDES,
} from "packages/ui/styles/variants/buttonVariants";

import type { ButtonProps, ButtonVariant } from "./Button";

/** RN-safe props to forward to Pressable (excludes DOM-specific ButtonHTMLAttributes) */
const PRESSABLE_FORWARD_KEYS = [
  "testID",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "accessibilityLevel",
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

const VARIANT_CLASSES: Record<Exclude<ButtonVariant, "cancel">, string> = {
  primary: "bg-primary",
  secondary: "bg-neutral-100",
  tertiary: "bg-accent disabled:bg-gold-locked",
  outline: "border border-border bg-transparent",
  ghost: "bg-transparent",
  danger: "bg-destructive",
  success: "bg-brand-secondary",
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 min-h-8",
  md: "px-4 py-2 min-h-10",
  lg: "px-5 py-2.5 min-h-12",
};

const TEXT_COLOR_CLASSES: Record<Exclude<ButtonVariant, "cancel">, string> = {
  primary: "text-white",
  secondary: "text-text-primary",
  tertiary: "text-white",
  outline: "text-text-primary",
  ghost: "text-text-primary",
  danger: "text-white",
  success: "text-white",
};

/**
 * Native Button - Pressable with variant/size styling.
 * Uses Text for children (no BodyText/span). Supports onPress.
 */
const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      iconPosition = "left",
      children,
      disabled,
      className = "",
      label,
      onPress,
      onClick,
      ...props
    },
    ref
  ) => {
    const effectiveVariant = variant === "cancel" ? "ghost" : variant;
    const variantClass = VARIANT_CLASSES[effectiveVariant];
    const sizeClass = SIZE_CLASSES[size];
    const textColorClass = TEXT_COLOR_CLASSES[effectiveVariant];

    const iconClassName = `${size === "lg" ? "h-5 w-5" : "h-4 w-4"} ${textColorClass}`;
    const resolvedIcon =
      icon ?? (iconName ? <Icon name={iconName} className={iconClassName} /> : null);

    const handlePress = onPress ?? (onClick as (() => void) | undefined);

    const content = loading ? (
      <>
        <RippleBackground overlay />
        <Box className="relative z-10 flex-row items-center justify-center gap-2">
          <Box className="items-center justify-center">{/* <KeyTurnLoader message="" /> */}</Box>
        </Box>
      </>
    ) : (
      <Box className="flex-row items-center justify-center gap-2">
        {resolvedIcon && iconPosition === "left" && (
          <Box className="items-center justify-center">{resolvedIcon}</Box>
        )}
        {children != null &&
          (typeof children === "string" ? (
            <Text
              className={`font-medium leading-none ${textColorClass} ${
                size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
              }`}
            >
              {children}
            </Text>
          ) : (
            children
          ))}
        {resolvedIcon && iconPosition === "right" && (
          <Box className="items-center justify-center">{resolvedIcon}</Box>
        )}
      </Box>
    );

    const pressableProps = pickPressableProps(props);
    const priorA11yState =
      pressableProps.accessibilityState &&
      typeof pressableProps.accessibilityState === "object" &&
      !Array.isArray(pressableProps.accessibilityState)
        ? (pressableProps.accessibilityState as Record<string, boolean | undefined>)
        : {};
    const mergedAccessibilityState = { ...priorA11yState, busy: loading };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled ?? loading}
        accessibilityLabel={label}
        className={`flex-row items-center justify-center rounded-lg ${variantClass} ${sizeClass} ${
          loading
            ? `${BUTTON_LOADING_FRAME_CLASSES} ${BUTTON_LOADING_VARIANT_OVERRIDES[effectiveVariant]}`
            : ""
        } ${""} ${className}`}
        {...pressableProps}
        accessibilityState={mergedAccessibilityState}
      >
        {content}
      </Pressable>
    );
  }
);

Button.displayName = "Button";

export default Button;
