import React, { forwardRef, useMemo } from "react";

import KeyTurnLoader from "@ui/loading/KeyTurnLoader.web";
import { log, LOG_CATEGORIES } from "logger";

import { getEnv } from "packages/config";
import {
  BUTTON_VARIANT_STYLES,
  type ButtonStyleVariant,
} from "packages/schemas/app/ui/button";
import type { IconName } from "packages/schemas/app/ui/icons";

import { getIcon } from "@/components/ui/icons/iconMap";

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
  "inline-flex items-center justify-center gap-2 font-medium leading-none select-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[0.5px]";

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
function renderIcon(
  icon: React.ReactNode,
  size: "sm" | "md" | "lg",
): React.ReactNode {
  const iconClass = ICON_SIZE_CLASS[size];
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    const existingClassName =
      (icon.props as { className?: string })?.className ?? "";
    const className = [existingClassName, iconClass].filter(Boolean).join(" ");
    return React.cloneElement(
      icon as React.ReactElement<{ className?: string }>,
      { className },
    );
  }
  return (
    <span className={`inline-flex items-center ${iconClass}`}>{icon}</span>
  );
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
      ...props
    },
    ref,
  ) => {
    const effectiveVariant: ButtonStyleVariant =
      variant === "cancel" ? "ghost" : variant;

    const resolvedIcon = icon ?? (iconName ? getIcon(iconName) : null);

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
      iconPosition === "right" &&
      iconAlign === "edge" &&
      (resolvedIcon || loading);
    const layoutClass = isEdgeRight ? "justify-between" : "justify-center";

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
      <span
        className={["inline-flex items-center", textVisibilityClass]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </span>
    );

    const loaderWrapperClass = `inline-flex items-center justify-center ${ICON_SIZE_CLASS[size]}`;
    const loaderSpan = (
      <span className={loaderWrapperClass}>
        <KeyTurnLoader message="" />
      </span>
    );

    if (getEnv().isDevelopment && hideTextBelow && !label) {
      log.warn(
        LOG_CATEGORIES.ERRORS,
        "[Button] hideTextBelow is set but label (aria-label) is missing. Provide label for accessibility when text is hidden.",
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={buttonClasses}
        disabled={disabled ?? loading}
        aria-label={label}
        title={label ?? undefined}
        {...props}
      >
        {isEdgeRight ? (
          <>
            <span className="inline-flex min-w-0 flex-1 items-center justify-start gap-2">
              {iconLeft && renderIcon(resolvedIcon, size)}
              {children ? textSpan : null}
            </span>
            {iconRight || loading ? (
              <span className="inline-flex shrink-0 items-center">
                {loading
                  ? loaderSpan
                  : iconRight
                    ? renderIcon(resolvedIcon, size)
                    : null}
              </span>
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
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
