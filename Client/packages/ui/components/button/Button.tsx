import React, { forwardRef, useMemo } from "react";

import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader.web";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import { BUTTON_VARIANT_STYLES, type ButtonStyleVariant } from "packages/ui/types/button";
import type { IconName } from "packages/ui/types/icons";

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
  /** Press handler for React Native. Web uses onClick. */
  onPress?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    children?: React.ReactNode;
  };

// ----- Design decisions (locked) -----
// - cancel variant: alias to ghost (recommended for cancel actions).
// - outline/ghost hover: tint only (bg-brand-accent/10), never full fill.
// - primary + tertiary: always white text; filled buttons use subtle darken on hover (/90).
// - Disabled: pointer-events-none in base; no disabled:hover:* in variants (they never trigger).
// ----- Button group guidance -----
// Confirmations: primary + ghost (cancel). Yes = primary, Cancel = ghost.
// "Back / Next": outline + primary, or secondary + primary, depending on vibe.

/** Single base string all variants share. Ensures spacing and icon alignment. */
const BASE_CLASSES =
  "inline-flex items-center gap-2 font-medium leading-none select-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[0.5px]";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "btn-responsive-sm",
  md: "btn-responsive-md",
  lg: "btn-responsive-lg",
};

const ROUNDED_CLASSES: Record<NonNullable<ButtonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const ICON_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4 shrink-0",
  md: "h-4 w-4 shrink-0",
  lg: "h-5 w-5 shrink-0",
};

/** Clone valid elements and append size class; wrap non-elements so icon never baseline-shifts. */
function renderIcon(icon: React.ReactNode, size: "sm" | "md" | "lg"): React.ReactNode {
  const iconClass = ICON_SIZE_CLASS[size];
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    const existingClassName = (icon.props as { className?: string })?.className ?? "";
    const className = [existingClassName, iconClass].filter(Boolean).join(" ");
    return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className,
    }) as React.ReactNode;
  }
  return (
    <BodyText as="span" className={`inline-flex items-center ${iconClass}`}>
      {icon}
    </BodyText>
  ) as React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      iconPosition = "left",
      iconAlign = "inline",
      fullWidth = false,
      rounded = "lg",
      className = "",
      children,
      disabled,
      hideTextBelow,
      label,
      type,
      onClick,
      onPress,
      ...props
    },
    ref
  ) => {
    const effectiveVariant: ButtonStyleVariant = variant === "cancel" ? "ghost" : variant;
    const isFilledWithWhiteText = ["primary", "tertiary", "danger", "success"].includes(
      effectiveVariant
    );
    const innerTextColorClass = isFilledWithWhiteText ? "text-inherit" : "";

    const resolvedIcon = icon ?? (iconName ? <Icon name={iconName} /> : null);

    // Create unified click handler for cross-platform compatibility
    const handleClick = onClick ?? onPress;

    const textVisibilityClass = useMemo(() => {
      if (!children || !hideTextBelow) return "";
      const map: Record<NonNullable<typeof hideTextBelow>, string> = {
        sm: "hidden sm:inline-flex",
        md: "hidden md:inline-flex",
        lg: "hidden lg:inline-flex",
        xl: "hidden xl:inline-flex",
        "2xl": "hidden 2xl:inline-flex",
      };
      return map[hideTextBelow];
    }, [children, hideTextBelow]);

    const isEdgeRight =
      iconPosition === "right" && iconAlign === "edge" && (resolvedIcon || loading);
    const layoutClass = isEdgeRight ? "justify-between" : "";

    const buttonClasses = [
      BASE_CLASSES,
      SIZE_CLASSES[size],
      ROUNDED_CLASSES[rounded],
      BUTTON_VARIANT_STYLES[effectiveVariant],
      fullWidth ? "w-full" : "",
      layoutClass,
      "touch-friendly",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // When loading, never show icon; loader uses the same slot (left or right) for stable layout.
    const iconLeft = !loading && resolvedIcon && iconPosition === "left";
    const iconRight = !loading && resolvedIcon && iconPosition === "right";
    const textSpan = (
      <BodyText
        as="span"
        className={[
          "inline-flex w-full items-center justify-center gap-2",
          textVisibilityClass,
          innerTextColorClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </BodyText>
    );

    const loaderWrapperClass =
      `inline-flex items-center justify-center ${ICON_SIZE_CLASS[size]} ${innerTextColorClass}`.trim();
    const loaderSpan = (
      <BodyText as="span" className={loaderWrapperClass}>
        <KeyTurnLoader message="" />
      </BodyText>
    );

    if (getEnv().isDevelopment && hideTextBelow && !label) {
      log.warn(
        LOG_CATEGORIES.ERRORS,
        "[Button] hideTextBelow is set but label (aria-label) is missing. Provide label for accessibility when text is hidden."
      );
    }

    const content = (
      isEdgeRight ? (
        <>
          <BodyText
            as="span"
            className={`inline-flex min-w-0 flex-1 items-center justify-start gap-2 ${innerTextColorClass}`.trim()}
          >
            {iconLeft && renderIcon(resolvedIcon, size)}
            {children ? textSpan : null}
          </BodyText>
          {iconRight || loading ? (
            <BodyText
              as="span"
              className={`inline-flex shrink-0 items-center ${innerTextColorClass}`.trim()}
            >
              {loading ? loaderSpan : iconRight ? renderIcon(resolvedIcon, size) : null}
            </BodyText>
          ) : null}
        </>
      ) : (
        <>
          {loading && iconPosition === "left" && loaderSpan}
          {iconLeft && renderIcon(resolvedIcon, size)}
          {children ? textSpan : null}
          {loading && iconPosition === "right" && loaderSpan}
          {iconRight && renderIcon(resolvedIcon, size)}
        </>
      )
    ) as React.ReactNode;

    return React.createElement(
      "button",
      {
        ref,
        type: type ?? "button",
        className: buttonClasses,
        disabled: disabled ?? loading,
        "aria-label": label,
        title: label ?? undefined,
        onClick: handleClick,
        ...props,
      },
      content
    );
  }
);

Button.displayName = "Button";

export default Button;
