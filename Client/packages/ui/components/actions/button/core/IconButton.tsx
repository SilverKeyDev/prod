import React, { cloneElement, forwardRef, isValidElement } from "react";

// import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { Icon } from "@ui/icons";

import { Box, Pressable } from "packages/ui/components/structure/primitives";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";
import { BUTTON_TRANSITION_CLASSES } from "packages/ui/styles/transitions/transitionClasses";
import type {
  IconButtonSize,
  IconButtonVariant,
} from "packages/ui/styles/variants/iconButtonVariants";
import {
  ICON_BUTTON_ACTIVE_BG_MAP,
  ICON_BUTTON_BASE_CLASSES,
  ICON_BUTTON_HOVER_BG_MAP,
  ICON_BUTTON_LOADING_FRAME_CLASSES,
  ICON_BUTTON_LOADING_VARIANT_OVERRIDES,
  ICON_BUTTON_ROUNDED_CLASSES,
  ICON_BUTTON_SIZE_CLASSES,
  ICON_BUTTON_TOUCH_CLASS,
  ICON_BUTTON_VARIANT_STYLES,
} from "packages/ui/styles/variants/iconButtonVariants";
import type { IconName } from "packages/ui/types/icons";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

/** strokeWidth for toolbar variant icons - 50% thinner than default (2) */
const TOOLBAR_ICON_STROKE_WIDTH = 1;

/** RN-safe props to forward to Pressable */
const PRESSABLE_FORWARD_KEYS = [
  "testID",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "nativeID",
] as const;

function pickPressableProps(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of PRESSABLE_FORWARD_KEYS) {
    if (key in props && props[key] !== undefined) {
      result[key] = props[key];
    }
  }
  return result;
}

type IconButtonOwnProps = {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  /** Icon element (e.g. Lucide icon). When both icon and iconName are set, icon takes precedence. */
  icon?: React.ReactNode;
  /** Icon by name (platform-resolved). */
  iconName?: IconName;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Custom hover background for toolbar variant. Default: gray-50 */
  hoverBg?: keyof typeof ICON_BUTTON_HOVER_BG_MAP;
  /** Custom active background for toolbar variant. Default: gray-100 */
  activeBg?: keyof typeof ICON_BUTTON_ACTIVE_BG_MAP;
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
  /** Cross-platform press handler. Web maps to onClick. */
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export type IconButtonProps = IconButtonOwnProps & {
  testID?: string;
  accessibilityRole?: string;
  accessibilityState?: object;
  accessibilityHint?: string;
  nativeID?: string;
};

const IconButton = forwardRef<React.ElementRef<typeof Pressable>, IconButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      rounded = "lg",
      className = "",
      disabled,
      hoverBg,
      activeBg,
      label,
      onPress,
      onClick,
      ...rest
    },
    ref
  ) => {
    const toolbarOverrides =
      variant === "toolbar" && (hoverBg ?? activeBg)
        ? [
            hoverBg
              ? ICON_BUTTON_HOVER_BG_MAP[hoverBg]
              : "hover:bg-gray-50 active:bg-gray-100 active:opacity-90",
            activeBg ? ICON_BUTTON_ACTIVE_BG_MAP[activeBg] : "",
          ].join(" ")
        : "";

    const buttonClasses = twMergeClasses(
      ICON_BUTTON_BASE_CLASSES,
      BUTTON_TRANSITION_CLASSES,
      ICON_BUTTON_SIZE_CLASSES[size],
      ICON_BUTTON_ROUNDED_CLASSES[rounded],
      ICON_BUTTON_VARIANT_STYLES[variant],
      toolbarOverrides,
      ICON_BUTTON_TOUCH_CLASS,
      loading
        ? `${ICON_BUTTON_LOADING_FRAME_CLASSES} ${ICON_BUTTON_LOADING_VARIANT_OVERRIDES[variant]}`
        : "",
      className
    );

    const resolvedIcon = icon ?? (iconName ? <Icon name={iconName} size={20} /> : null);

    const iconWithStroke =
      variant === "toolbar" &&
      isValidElement(resolvedIcon) &&
      typeof (resolvedIcon as React.ReactElement).type !== "string"
        ? cloneElement(resolvedIcon as React.ReactElement<{ strokeWidth?: number }>, {
            strokeWidth: TOOLBAR_ICON_STROKE_WIDTH,
          })
        : resolvedIcon;

    const handlePress = onPress ?? onClick;
    const pressableProps = pickPressableProps(rest);

    const content = loading ? (
      <>
        <RippleBackground overlay />
        <Box className="z-header relative items-center justify-center">
          {/* <KeyTurnLoader message="" /> */}
        </Box>
      </>
    ) : (
      iconWithStroke
    );

    return (
      <Pressable
        ref={ref}
        className={buttonClasses}
        disabled={disabled ?? loading}
        onPress={handlePress}
        aria-label={label}
        accessibilityRole="button"
        accessibilityLabel={label}
        {...pressableProps}
      >
        {content}
      </Pressable>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
