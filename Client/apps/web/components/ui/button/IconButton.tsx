import React, { cloneElement, forwardRef, isValidElement } from "react";

import KeyTurnLoader from "@ui/loading/KeyTurnLoader.web";

/** strokeWidth for toolbar variant icons - 50% thinner than default (2) */
const TOOLBAR_ICON_STROKE_WIDTH = 1;

const HOVER_BG_MAP = {
  "gray-50": "hover:bg-gray-50",
  "gray-100": "hover:bg-gray-100",
  "gray-200": "hover:bg-gray-200",
} as const;

const ACTIVE_BG_MAP = {
  "gray-100": "active:bg-gray-100",
  "gray-200": "active:bg-gray-200",
  "gray-300": "active:bg-gray-300",
} as const;

export type IconButtonProps = {
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "outline"
    | "ghost"
    | "danger"
    | "toolbar";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "small" | "medium" | "large";
  loading?: boolean;
  icon: React.ReactNode;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Custom hover background for toolbar variant. Default: gray-50 */
  hoverBg?: keyof typeof HOVER_BG_MAP;
  /** Custom active background for toolbar variant. Default: gray-100 */
  activeBg?: keyof typeof ACTIVE_BG_MAP;
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      rounded = "lg",
      className = "",
      disabled,
      hoverBg,
      activeBg,
      label,
      ...props
    },
    ref,
  ) => {
    // Base styles that apply to all icon buttons
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed";

    // Size variants for icon buttons (square)
    // small/medium/large: fixed dimensions for toolbar-style buttons
    const sizeStyles = {
      xs: "mobile-icon-xs text-responsive-xs",
      sm: "mobile-icon-sm text-responsive-xs",
      md: "mobile-icon-md text-responsive-sm",
      lg: "mobile-icon-lg text-responsive-sm",
      xl: "mobile-icon-xl text-responsive-md",
      small: "h-6 w-6 min-h-6 min-w-6",
      medium: "h-7 w-7 min-h-7 min-w-7",
      large: "h-8 w-8 min-h-8 min-w-8",
    };

    // Rounded variants
    const roundedStyles = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    };

    // Gray secondary (no olive). Matches Button secondary/cancel.
    const graySecondary =
      "border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:border-gray-300 focus:ring-gray-300/20 disabled:bg-gray-200/50 disabled:text-gray-500 disabled:border-gray-200";

    // Color variants - using brand tokens to match Button component
    const variantStyles = {
      primary:
        "bg-brand-accent text-white hover:bg-brand-accent/90 focus:ring-brand-accent/20 disabled:bg-brand-accent/50 disabled:text-white/70",
      secondary: graySecondary,
      tertiary:
        "bg-gold-muted text-white hover:bg-gold-muted/90 active:bg-gold-muted/85 focus:ring-gold-muted/25 disabled:bg-gold-muted/50 disabled:text-white/70",
      outline:
        "border border-brand-accent text-brand-accent bg-white hover:bg-brand-accent hover:text-white focus:ring-brand-accent/20 disabled:border-brand-accent/30 disabled:text-brand-accent/30 disabled:hover:bg-white disabled:hover:text-brand-accent/30",
      ghost:
        "text-brand-accent hover:bg-brand-accent/10 focus:ring-brand-accent/20 disabled:text-brand-accent/30 disabled:hover:bg-transparent",
      danger:
        "bg-rose text-white hover:bg-rose-light focus:ring-rose/20 disabled:bg-rose/50 disabled:text-white/70",
      toolbar:
        "bg-transparent text-gray-600 border-0 shadow-none hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-0 disabled:text-gray-400 disabled:hover:bg-transparent disabled:active:bg-transparent",
    };

    // Toolbar variant supports custom hover/active overrides
    const toolbarOverrides =
      variant === "toolbar" && (hoverBg ?? activeBg)
        ? [
            hoverBg ? HOVER_BG_MAP[hoverBg] : "hover:bg-gray-50",
            activeBg ? ACTIVE_BG_MAP[activeBg] : "active:bg-gray-100",
          ].join(" ")
        : "";

    // Touch-friendly class for mobile
    const touchFriendlyClass = "touch-manipulation active:scale-95";

    // Combine all classes
    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      roundedStyles[rounded],
      variantStyles[variant],
      toolbarOverrides,
      touchFriendlyClass,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const iconWithStroke =
      variant === "toolbar" &&
      isValidElement(icon) &&
      typeof (icon as React.ReactElement).type !== "string"
        ? cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, {
            strokeWidth: TOOLBAR_ICON_STROKE_WIDTH,
          })
        : icon;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled ?? loading}
        aria-label={label}
        {...props}
      >
        {loading ? <KeyTurnLoader message="" /> : iconWithStroke}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
