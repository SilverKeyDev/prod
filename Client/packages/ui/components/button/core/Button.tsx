import React, { forwardRef, useMemo } from "react";

// import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { Icon } from "@ui/icons";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import RippleBackground from "packages/ui/components/backgrounds/RippleBackground";
import { Box, Pressable } from "packages/ui/components/primitives";
import { tailwindButtonLabelHoverTypography } from "packages/ui/styles/theme/navTabTypography";
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

import { renderButtonLabelSlot } from "./buttonLabelSlot";
import {
  renderButtonEdgeRightRow,
  renderButtonLoadingSlot,
  renderButtonStandardRow,
} from "./buttonRowContent";

/** Web container-query breakpoint: show text beside icon when button inline-size ≥ 11rem. */
const BUTTON_WEB_ICON_COLLAPSE_SHOW_LABEL_AT = "@[11rem]";

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

function pickPressableProps(props: Record<string, unknown>): Record<string, unknown> {
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
  /** Icon by name (platform-resolved). When both icon and iconName are set, icon takes precedence.
   *  Prefer passing iconName or icon whenever children include visible action text so the button can
   *  collapse to icon-only inside narrow layouts (web container queries). */
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
   * When false, string labels use nowrap without ellipsis so the button can grow with flex layout.
   * Default true (truncate long labels inside constrained widths).
   */
  truncateLabel?: boolean;

  /**
   * Web only: when true, hides the label and shows icon-only until the button is at least 11rem wide
   * (@container). Default false so icon+label buttons keep visible text in typical flex/toolbar layouts.
   */
  collapseIconWhenNarrow?: boolean;

  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
  /** Cross-platform press handler. Web maps to onClick. */
  onPress?: (e?: unknown) => void;
  /** Web legacy; receives click event. Prefer onPress for cross-platform. */
  onClick?: (e?: unknown) => void;
  /** Merged onto the label row (string or JSX children) after default typography. */
  labelSlotClassName?: string;
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
  /** Forwarded to Pressable (native) / implicit on web. */
  accessibilityRole?: string;
  accessibilityState?: Record<string, boolean | undefined>;
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
  textColorClass: string
): React.ReactNode {
  const iconClass = `${BUTTON_ICON_SIZE_CLASS[size]} ${textColorClass}`.trim();
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    const existingClassName = (icon.props as { className?: string })?.className ?? "";
    const className = [existingClassName, iconClass].filter(Boolean).join(" ");
    return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className,
    }) as React.ReactNode;
  }
  return (
    <Box className={`inline-flex flex-row items-center ${iconClass}`}>{icon}</Box>
  ) as React.ReactNode;
}

function shouldCollapseIconLabelRowOnWeb(args: {
  collapseIconWhenNarrow: boolean;
  hideTextBelow: ButtonProps["hideTextBelow"];
  loading: boolean;
  resolvedIcon: React.ReactNode;
  children: React.ReactNode;
}): boolean {
  if (!args.collapseIconWhenNarrow || args.loading || !args.resolvedIcon) return false;
  if (args.hideTextBelow) return false;
  return args.children != null && args.children !== false;
}

function buildButtonTextVisibilityClass(
  children: React.ReactNode,
  hideTextBelow: ButtonProps["hideTextBelow"]
): string {
  if (!children || !hideTextBelow) return "";
  const map: Record<NonNullable<typeof hideTextBelow>, string> = {
    sm: "hidden sm:inline-flex flex-row",
    md: "hidden md:inline-flex flex-row",
    lg: "hidden lg:inline-flex flex-row",
    xl: "hidden xl:inline-flex flex-row",
    "2xl": "hidden 2xl:inline-flex flex-row",
  };
  return map[hideTextBelow];
}

function warnButtonCollapseA11yIfNeeded(args: {
  containerCollapse: boolean;
  children: React.ReactNode;
  derivedAccessibleLabel: string | undefined;
}): void {
  if (
    getEnv().isDevelopment &&
    args.containerCollapse &&
    typeof args.children !== "string" &&
    args.derivedAccessibleLabel == null
  ) {
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "[Button] Icon collapse uses JSX children — provide label or aria-label for accessibility when the label hides at narrow widths."
    );
  }
}

function buildButtonClassListString(args: {
  mainAxisJustify: string;
  size: NonNullable<ButtonProps["size"]>;
  rounded: NonNullable<ButtonProps["rounded"]>;
  effectiveVariant: ButtonStyleVariant;
  fullWidth: boolean;
  layoutClass: string;
  loading: boolean;
  containerCollapse: boolean;
  className: string;
}): string {
  return [
    BUTTON_BASE_CLASSES,
    args.mainAxisJustify,
    BUTTON_TRANSITION_CLASSES,
    BUTTON_SIZE_CLASSES[args.size],
    BUTTON_ROUNDED_CLASSES[args.rounded],
    BUTTON_VARIANT_STYLES[args.effectiveVariant],
    args.fullWidth ? "w-full" : "",
    args.layoutClass,
    args.loading
      ? `${BUTTON_LOADING_FRAME_CLASSES} ${BUTTON_LOADING_VARIANT_OVERRIDES[args.effectiveVariant]}`
      : "",
    args.containerCollapse ? "@container" : "",
    "touch-friendly",
    !isNative && !args.loading ? "group" : "",
    "",
    args.className,
  ]
    .filter(Boolean)
    .join(" ");
}

function mergeButtonAccessibilityState(
  pressableProps: Record<string, unknown>,
  loading: boolean
): Record<string, boolean | undefined> {
  const priorA11yState =
    pressableProps.accessibilityState &&
    typeof pressableProps.accessibilityState === "object" &&
    !Array.isArray(pressableProps.accessibilityState)
      ? (pressableProps.accessibilityState as Record<string, boolean | undefined>)
      : {};
  return { ...priorA11yState, busy: loading };
}

function buildButtonRowContent(args: {
  loading: boolean;
  textColorClass: string;
  isEdgeRight: boolean;
  iconLeft: boolean;
  iconRight: boolean;
  resolvedIcon: React.ReactNode;
  textContent: React.ReactNode;
  size: NonNullable<ButtonProps["size"]>;
  contentAlign: NonNullable<ButtonProps["contentAlign"]>;
}): React.ReactNode {
  if (args.loading) {
    return (
      <>
        <RippleBackground overlay />
        {renderButtonLoadingSlot(args.textColorClass)}
      </>
    );
  }
  if (args.isEdgeRight) {
    return renderButtonEdgeRightRow({
      iconLeft: args.iconLeft,
      iconRight: args.iconRight,
      resolvedIcon: args.resolvedIcon,
      textContent: args.textContent,
      size: args.size,
      textColorClass: args.textColorClass,
      renderIcon,
    });
  }
  return renderButtonStandardRow({
    iconLeft: args.iconLeft,
    iconRight: args.iconRight,
    resolvedIcon: args.resolvedIcon,
    textContent: args.textContent,
    contentAlign: args.contentAlign,
    size: args.size,
    textColorClass: args.textColorClass,
    renderIcon,
  });
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
      truncateLabel = true,
      collapseIconWhenNarrow = false,
      label,
      type = "button",
      onClick,
      onPress,
      labelSlotClassName,
      title,
      style,
      id,
      role,
      "aria-current": ariaCurrent,
      tabIndex,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const effectiveVariant: ButtonStyleVariant = variant === "cancel" ? "ghost" : variant;
    const textColorClass = BUTTON_TEXT_COLOR_CLASSES[effectiveVariant];
    const textSizeClass = BUTTON_TEXT_SIZE_CLASSES[size];
    const iconClassName = `${BUTTON_ICON_SIZE_CLASS[size]} ${textColorClass}`.trim();

    const resolvedIcon =
      icon ?? (iconName ? <Icon name={iconName} className={iconClassName} /> : null);

    /** Web-only: when cramped, hide label and keep icon (container queries). */
    const containerCollapse =
      !isNative &&
      shouldCollapseIconLabelRowOnWeb({
        collapseIconWhenNarrow,
        hideTextBelow,
        loading,
        resolvedIcon,
        children,
      });

    const derivedAccessibleLabel =
      ariaLabel ?? label ?? (typeof children === "string" ? children : undefined);

    warnButtonCollapseA11yIfNeeded({ containerCollapse, children, derivedAccessibleLabel });

    // Unified press handler: prefer onPress (cross-platform), fallback to onClick (web legacy)
    const handlePress = onPress ?? onClick;

    const textVisibilityClass = useMemo(
      () => buildButtonTextVisibilityClass(children, hideTextBelow),
      [children, hideTextBelow]
    );

    const isEdgeRight =
      !loading && iconPosition === "right" && iconAlign === "edge" && Boolean(resolvedIcon);
    const layoutClass = isEdgeRight ? "justify-between" : "";
    const mainAxisJustify = isEdgeRight
      ? ""
      : contentAlign === "start"
        ? "justify-start"
        : "justify-center";

    const buttonClasses = buildButtonClassListString({
      mainAxisJustify,
      size,
      rounded,
      effectiveVariant,
      fullWidth,
      layoutClass,
      loading,
      containerCollapse,
      className,
    });

    if (typeof __DEV__ !== "undefined" && __DEV__ && isNative) {
      log.debug(LOG_CATEGORIES.STYLING, "[Button] buttonClasses", {
        truncated: buttonClasses.slice(0, 80) + (buttonClasses.length > 80 ? "..." : ""),
      });
      log.debug(LOG_CATEGORIES.STYLING, "[Button] full classes", buttonClasses);
    }

    const iconLeft = !loading && resolvedIcon && iconPosition === "left";
    const iconRight = !loading && resolvedIcon && iconPosition === "right";

    const contentInnerLayoutClass =
      contentAlign === "start"
        ? "inline-flex w-full flex-row items-center justify-start gap-2 text-left font-medium leading-none"
        : "inline-flex flex-row items-center justify-center gap-2 text-center font-medium leading-none";

    const textContent = renderButtonLabelSlot({
      children,
      containerCollapse,
      contentAlign,
      textVisibilityClass,
      contentInnerLayoutClass,
      collapseShowLabelAt: BUTTON_WEB_ICON_COLLAPSE_SHOW_LABEL_AT,
      textColorClass,
      textSizeClass,
      truncateLabel,
      labelSlotClassName,
      groupHoverLabelClassName:
        !isNative && !loading ? tailwindButtonLabelHoverTypography[size] : undefined,
    });

    if (getEnv().isDevelopment && hideTextBelow && !label && !ariaLabel) {
      log.warn(
        LOG_CATEGORIES.ERRORS,
        "[Button] hideTextBelow is set but label or aria-label is missing. Provide label for accessibility when text is hidden."
      );
    }

    const content = buildButtonRowContent({
      loading,
      textColorClass,
      isEdgeRight,
      iconLeft,
      iconRight,
      resolvedIcon,
      textContent,
      size,
      contentAlign,
    });

    const pressableProps = pickPressableProps(props);
    const mergedAccessibilityState = mergeButtonAccessibilityState(pressableProps, loading);

    /** Native: merge buttonNativeSizes (CVA native: doesn't apply at Babel time). No inline theme overrides. */
    const nativeSizeStyle = isNative ? buttonNativeSizes[size ?? "md"] : undefined;
    const mergedStyle = isNative ? [nativeSizeStyle, style].filter(Boolean) : style;

    return (
      <Pressable
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled ?? loading}
        onPress={handlePress}
        aria-label={derivedAccessibleLabel}
        accessibilityLabel={derivedAccessibleLabel}
        title={title ?? derivedAccessibleLabel}
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
  }
);

Button.displayName = "Button";

export default Button;
