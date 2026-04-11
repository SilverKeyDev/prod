import React, { forwardRef, useMemo } from "react";

// import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { Icon } from "@ui/icons";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import RippleBackground from "packages/ui/components/backgrounds/RippleBackground";
import { Box, Pressable, Row, Text } from "packages/ui/components/primitives";
import { BUTTON_TRANSITION_CLASSES } from "packages/ui/styles/transitions/transitionClasses";
import { buttonNativeSizes } from "packages/ui/styles/variants/buttonSizes";
import {
  BUTTON_BASE_CLASSES,
  BUTTON_ICON_SIZE_CLASS,
  BUTTON_LOADING_FRAME_CLASSES,
  BUTTON_LOADING_VARIANT_OVERRIDES,
  BUTTON_ROUNDED_CLASSES,
  BUTTON_SIZE_CLASSES,
  BUTTON_TEXT_COLOR_CLASSES,
  BUTTON_TEXT_SIZE_CLASSES,
  BUTTON_VARIANT_STYLES,
  type ButtonStyleVariant,
} from "packages/ui/styles/variants/buttonVariants";
import type { IconName } from "packages/ui/types/icons";
import { isNative } from "packages/utils/platform";

/**
 * Variants: primary (CTA), secondary (neutral), tertiary (gold), outline, ghost, danger, success.
 * Cancel is a true alias of ghost (no separate style).
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "cancel";

/** RN-safe props to forward to Pressable */
const PRESSABLE_FORWARD_KEYS = [
  "testID",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "accessibilityLevel",
  "nativeID",
] as const;

function pickPressableProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of PRESSABLE_FORWARD_KEYS) {
    if (key in props && props[key] !== undefined) {
      result[key] = props[key];
    }
  }
  return result;
}

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Icon element (e.g. Lucide icon). Rendered left of text by default. */
  icon?: React.ReactNode;
  /** Icon by name (platform-resolved). When both icon and iconName are set, icon takes precedence. */
  iconName?: IconName;
  /** Icon position relative to text. Default "left". */
  iconPosition?: "left" | "right";
  /** "inline" = icon next to text; "edge" = flush right (only when iconPosition="right"). */
  iconAlign?: "inline" | "edge";
  /**
   * Horizontal alignment of label/content. Use "start" for list rows and menus so nested
   * JSX is not forced to justify-center/text-center by the inner wrapper.
   */
  contentAlign?: "center" | "start";
  fullWidth?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  /**
   * If provided, hides button text below the given Tailwind breakpoint (icon-only on small screens).
   * When using hideTextBelow, you must provide label for accessibility (aria-label).
   * Example: hideTextBelow="md" will hide text on screens narrower than md (768px).
   */
  hideTextBelow?: "sm" | "md" | "lg" | "xl" | "2xl";

  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
  /** Cross-platform press handler. Web maps to onClick. */
  onPress?: (e?: unknown) => void;
  /** Web legacy; receives click event. Prefer onPress for cross-platform. */
  onClick?: (e?: unknown) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  /** Inline styles (forwarded to Pressable). */
  style?: React.CSSProperties;
  id?: string;
  role?: string;
  "aria-current"?: string;
  /** Exclude from tab order when -1. Forwarded to underlying element. */
  tabIndex?: number;
  /** Accessibility label (alias for label; forwarded when label not set). */
  "aria-label"?: string;
};

// ----- Design decisions (locked) -----
// - cancel variant: alias to ghost (recommended for cancel actions).
// - outline/ghost hover: tint only (bg-neutral-100), never full fill.
// - primary + tertiary: always white text; filled buttons use subtle darken on hover (/90).
// - Disabled: pointer-events-none in base; no disabled:hover:* in variants (they never trigger).
// ----- Button group guidance -----
// Confirmations: primary + ghost (cancel). Yes = primary, Cancel = ghost.
// "Back / Next": outline + primary, or secondary + primary, depending on vibe.

/** Clone valid elements and append size class; wrap non-elements so icon never baseline-shifts. */
function renderIcon(
  icon: React.ReactNode,
  size: "sm" | "md" | "lg",
  textColorClass: string,
): React.ReactNode {
  const iconClass = `${BUTTON_ICON_SIZE_CLASS[size]} ${textColorClass}`.trim();
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    const existingClassName =
      (icon.props as { className?: string })?.className ?? "";
    const className = [existingClassName, iconClass].filter(Boolean).join(" ");
    return React.cloneElement(
      icon as React.ReactElement<{ className?: string }>,
      {
        className,
      },
    ) as React.ReactNode;
  }
  return (
    <Box className={`inline-flex flex-row items-center ${iconClass}`}>
      {icon}
    </Box>
  ) as React.ReactNode;
}

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      iconPosition = "left",
      iconAlign = "inline",
      contentAlign = "center",
      fullWidth = false,
      rounded = "lg",
      className = "",
      children,
      disabled,
      hideTextBelow,
      label,
      type = "button",
      onClick,
      onPress,
      title,
      style,
      id,
      role,
      "aria-current": ariaCurrent,
      tabIndex,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const effectiveVariant: ButtonStyleVariant =
      variant === "cancel" ? "ghost" : variant;
    const textColorClass = BUTTON_TEXT_COLOR_CLASSES[effectiveVariant];
    const textSizeClass = BUTTON_TEXT_SIZE_CLASSES[size];
    const iconClassName =
      `${BUTTON_ICON_SIZE_CLASS[size]} ${textColorClass}`.trim();

    const resolvedIcon =
      icon ??
      (iconName ? <Icon name={iconName} className={iconClassName} /> : null);

    // Unified press handler: prefer onPress (cross-platform), fallback to onClick (web legacy)
    const handlePress = onPress ?? onClick;

    const textVisibilityClass = useMemo(() => {
      if (!children || !hideTextBelow) return "";
      const map: Record<NonNullable<typeof hideTextBelow>, string> = {
        sm: "hidden sm:inline-flex flex-row",
        md: "hidden md:inline-flex flex-row",
        lg: "hidden lg:inline-flex flex-row",
        xl: "hidden xl:inline-flex flex-row",
        "2xl": "hidden 2xl:inline-flex flex-row",
      };
      return map[hideTextBelow];
    }, [children, hideTextBelow]);

    const isEdgeRight =
      !loading &&
      iconPosition === "right" &&
      iconAlign === "edge" &&
      Boolean(resolvedIcon);
    const layoutClass = isEdgeRight ? "justify-between" : "";
    const mainAxisJustify = isEdgeRight
      ? ""
      : contentAlign === "start"
        ? "justify-start"
        : "justify-center";

    const buttonClasses = [
      BUTTON_BASE_CLASSES,
      mainAxisJustify,
      BUTTON_TRANSITION_CLASSES,
      BUTTON_SIZE_CLASSES[size],
      BUTTON_ROUNDED_CLASSES[rounded],
      BUTTON_VARIANT_STYLES[effectiveVariant],
      fullWidth ? "w-full" : "",
      layoutClass,
      loading
        ? `${BUTTON_LOADING_FRAME_CLASSES} ${BUTTON_LOADING_VARIANT_OVERRIDES[effectiveVariant]}`
        : "",
      "touch-friendly",
      "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (typeof __DEV__ !== "undefined" && __DEV__ && isNative) {
      log.debug(LOG_CATEGORIES.STYLING, "[Button] buttonClasses", {
        truncated:
          buttonClasses.slice(0, 80) + (buttonClasses.length > 80 ? "..." : ""),
      });
      log.debug(LOG_CATEGORIES.STYLING, "[Button] full classes", buttonClasses);
    }

    const iconLeft = !loading && resolvedIcon && iconPosition === "left";
    const iconRight = !loading && resolvedIcon && iconPosition === "right";

    const contentInnerLayoutClass =
      contentAlign === "start"
        ? "inline-flex w-full flex-row items-center justify-start gap-2 text-left font-medium leading-none"
        : "inline-flex w-full flex-row items-center justify-center gap-2 text-center font-medium leading-none";

    const loaderBox = (
      <Box
        className={`h-8 w-8 shrink-0 items-center justify-center ${textColorClass}`.trim()}
      >
        {/* <KeyTurnLoader message="" /> */}
      </Box>
    );

    const textContent =
      children != null ? (
        typeof children === "string" ? (
          <Text
            className={[
              contentInnerLayoutClass,
              textVisibilityClass,
              textColorClass,
              textSizeClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </Text>
        ) : (
          <Box
            className={[
              contentInnerLayoutClass,
              textVisibilityClass,
              textColorClass,
              textSizeClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </Box>
        )
      ) : null;

    if (getEnv().isDevelopment && hideTextBelow && !label) {
      log.warn(
        LOG_CATEGORIES.ERRORS,
        "[Button] hideTextBelow is set but label (aria-label) is missing. Provide label for accessibility when text is hidden.",
      );
    }

    const loadingOnlyContent = (
      <>
        <RippleBackground overlay />
        <Row className="relative z-10 items-center justify-center gap-2">
          {loaderBox}
        </Row>
      </>
    );

    const content = loading ? (
      loadingOnlyContent
    ) : isEdgeRight ? (
      <>
        <Box
          className={`min-w-0 flex-1 items-center justify-start gap-2 ${textColorClass}`.trim()}
        >
          {iconLeft && renderIcon(resolvedIcon, size, textColorClass)}
          {textContent}
        </Box>
        {iconRight && (
          <Box className={`shrink-0 items-center ${textColorClass}`.trim()}>
            {renderIcon(resolvedIcon, size, textColorClass)}
          </Box>
        )}
      </>
    ) : (
      <Row
        className={
          contentAlign === "start"
            ? "w-full items-center justify-start gap-2"
            : "items-center justify-center gap-2"
        }
      >
        {iconLeft && (
          <Box
            className={
              contentAlign === "start"
                ? "shrink-0 items-center justify-center"
                : "items-center justify-center"
            }
          >
            {renderIcon(resolvedIcon, size, textColorClass)}
          </Box>
        )}
        {textContent}
        {iconRight && (
          <Box
            className={
              contentAlign === "start"
                ? "shrink-0 items-center justify-center"
                : "items-center justify-center"
            }
          >
            {renderIcon(resolvedIcon, size, textColorClass)}
          </Box>
        )}
      </Row>
    );

    const pressableProps = pickPressableProps(props);
    const priorA11yState =
      pressableProps.accessibilityState &&
      typeof pressableProps.accessibilityState === "object" &&
      !Array.isArray(pressableProps.accessibilityState)
        ? (pressableProps.accessibilityState as Record<
            string,
            boolean | undefined
          >)
        : {};
    const mergedAccessibilityState = { ...priorA11yState, busy: loading };

    /** Native: merge buttonNativeSizes (CVA native: doesn't apply at Babel time). No inline theme overrides. */
    const nativeSizeStyle = isNative
      ? buttonNativeSizes[size ?? "md"]
      : undefined;
    const mergedStyle = isNative
      ? [nativeSizeStyle, style].filter(Boolean)
      : style;

    return (
      <Pressable
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled ?? loading}
        onPress={handlePress}
        aria-label={ariaLabel ?? label}
        accessibilityLabel={ariaLabel ?? label}
        title={title ?? label}
        style={mergedStyle}
        id={id}
        role={role}
        aria-current={ariaCurrent}
        tabIndex={tabIndex}
        {...pressableProps}
        aria-busy={loading}
        accessibilityState={mergedAccessibilityState}
      >
        {content}
      </Pressable>
    );
  },
);

Button.displayName = "Button";

export default Button;
