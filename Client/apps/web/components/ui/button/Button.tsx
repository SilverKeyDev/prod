import React, { forwardRef, useMemo } from "react";
import KeyTurnLoader from "../loading/KeyTurnLoader";

export type ButtonProps = {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "filter"
    | "sort"
    | "olive"
    | "cancel";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  /**
   * If provided, hides button text below the given Tailwind breakpoint.
   * Example: hideTextBelow="md" will hide text on screens narrower than md (768px).
   */
  hideTextBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      rounded = "lg",
      className = "",
      children,
      disabled,
      hideTextBelow,
      ...props
    },
    ref,
  ) => {
    // Tailwind-responsive class for text visibility
    const textVisibilityClass = useMemo(() => {
      if (!children) return "";
      if (!hideTextBelow) return "";

      // Use explicit mappings so Tailwind JIT can detect all classes at build time
      const visibilityByBreakpoint: Record<
        NonNullable<typeof hideTextBelow>,
        string
      > = {
        sm: "hidden sm:inline-flex",
        md: "hidden md:inline-flex",
        lg: "hidden lg:inline-flex",
        xl: "hidden xl:inline-flex",
        "2xl": "hidden 2xl:inline-flex",
      };

      return visibilityByBreakpoint[hideTextBelow];
    }, [children, hideTextBelow]);

    // Base styles that apply to all buttons
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed";

    // Size variants - responsive (assumes your Tailwind/util classes exist)
    const sizeStyles = {
      xs: "btn-responsive-sm",
      sm: "btn-responsive-sm",
      md: "btn-responsive-md",
      lg: "btn-responsive-lg",
      xl: "btn-responsive-lg",
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

    // Color variants - muted design system
    const variantStyles = {
      primary:
        "bg-brand-accent text-white hover:bg-brand-accent/90 focus:ring-brand-accent/20 disabled:bg-brand-accent/50 disabled:text-white/70",
      secondary:
        "bg-brand-tertiary text-brand-primary hover:bg-brand-tertiary/80 focus:ring-brand-tertiary/20 disabled:bg-brand-tertiary/50 disabled:text-brand-primary/50",
      outline:
        "border border-brand-accent text-brand-accent bg-neutral-50 hover:bg-brand-accent hover:text-white focus:ring-brand-accent/20 disabled:border-brand-accent/30 disabled:text-brand-accent/30 disabled:hover:bg-neutral-50 disabled:hover:text-brand-accent/30",
      ghost:
        "text-brand-accent hover:bg-brand-accent/10 focus:ring-brand-accent/20 disabled:text-brand-accent/30 disabled:hover:bg-transparent",
      danger:
        "bg-rose text-white hover:bg-rose-light focus:ring-rose/20 disabled:bg-rose/50 disabled:text-white/70",
      success:
        "bg-brand-secondary text-white hover:bg-brand-secondary/90 focus:ring-brand-secondary/20 disabled:bg-brand-secondary/50 disabled:text-white/70",
      warning:
        "bg-gold-muted text-white hover:bg-gold-muted/90 focus:ring-gold-muted/20 disabled:bg-gold-muted/50 disabled:text-white/70",
      info: "bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500/20 disabled:bg-neutral-600/50 disabled:text-white/70",
      filter:
        "border border-beige text-white bg-beige hover:bg-beige/90 hover:border-brown focus:bg-beige focus:text-white focus:ring-brown/20 focus:border-brown active:bg-beige disabled:bg-beige/50 disabled:text-white/70",
      sort: "border border-beige text-white bg-beige hover:bg-beige/90 hover:border-brown focus:bg-beige focus:text-white focus:ring-brown/20 focus:border-brown active:bg-beige disabled:bg-beige/50 disabled:text-white/70",
      olive:
        "bg-olive text-white hover:bg-olive-light focus:ring-olive/20 disabled:bg-olive/50 disabled:text-white/70",
      cancel:
        "border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:border-gray-300 focus:ring-gray-300/20 disabled:bg-gray-200/50 disabled:text-gray-500 disabled:border-gray-200",
    };

    // Touch-friendly class for mobile
    const touchFriendlyClass = "touch-friendly";

    // Full width class
    const widthClass = fullWidth ? "w-full" : "";

    // Combine all classes
    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      roundedStyles[rounded],
      variantStyles[variant],
      touchFriendlyClass,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Responsive icon sizing based on button size
    const getResponsiveIconClass = (iconElement: React.ReactNode) => {
      if (!React.isValidElement(iconElement)) return iconElement;

      const sizeToIconClass = {
        xs: "w-4 h-4 sm:w-5 sm:h-5",
        sm: "w-4 h-4 sm:w-5 sm:h-5",
        md: "w-5 h-5 sm:w-6 sm:h-6",
        lg: "w-5 h-5 sm:w-6 sm:h-6",
        xl: "w-6 h-6 sm:w-7 sm:h-7",
      };

      const existingClassName =
        (iconElement.props as { className?: string })?.className ?? "";
      const newClassName =
        `${existingClassName} ${sizeToIconClass[size]} flex-shrink-0`.trim();

      return React.cloneElement(
        iconElement as React.ReactElement<{ className?: string }>,
        { className: newClassName },
      );
    };

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled ?? loading}
        {...props}
      >
        <div className="flex w-full flex-col items-center justify-center">
          <div className="flex items-center justify-center whitespace-nowrap">
            {loading && (
              <div
                className={(() => {
                  const baseClasses = "scale-75 sm:scale-100 px-1 sm:px-0";
                  if (!children) return baseClasses;
                  if (!hideTextBelow) return `${baseClasses} mr-1 sm:mr-2`;
                  // When hideTextBelow is set, only apply margin when text is visible
                  // Below the breakpoint, text is hidden so loader should be centered (no margin)
                  const rightMarginByBreakpoint: Record<
                    NonNullable<typeof hideTextBelow>,
                    string
                  > = {
                    sm: `${baseClasses} sm:mr-2`,
                    md: `${baseClasses} md:mr-2`,
                    lg: `${baseClasses} lg:mr-2`,
                    xl: `${baseClasses} xl:mr-2`,
                    "2xl": `${baseClasses} 2xl:mr-2`,
                  };
                  return rightMarginByBreakpoint[hideTextBelow];
                })()}
              >
                <KeyTurnLoader message="" />
              </div>
            )}

            {!loading && icon && iconPosition === "left" && (
              <div
                className={(() => {
                  if (!children) return "";
                  if (!hideTextBelow) return "mr-1 sm:mr-2";
                  const rightMarginByBreakpoint: Record<
                    NonNullable<typeof hideTextBelow>,
                    string
                  > = {
                    sm: "mr-1 sm:mr-2",
                    md: "mr-1 md:mr-2",
                    lg: "mr-1 lg:mr-2",
                    xl: "mr-1 xl:mr-2",
                    "2xl": "mr-1 2xl:mr-2",
                  };
                  return rightMarginByBreakpoint[hideTextBelow];
                })()}
              >
                {getResponsiveIconClass(icon)}
              </div>
            )}

            {/* Hide text below breakpoint using Tailwind responsive utilities */}
            {children && (
              <span
                className={["flex-1", textVisibilityClass]
                  .filter(Boolean)
                  .join(" ")}
              >
                {children}
              </span>
            )}

            {!loading && icon && iconPosition === "right" && (
              <div
                className={(() => {
                  if (!children) return "";
                  if (!hideTextBelow) return "ml-1 sm:ml-2";
                  const leftMarginByBreakpoint: Record<
                    NonNullable<typeof hideTextBelow>,
                    string
                  > = {
                    sm: "ml-1 sm:ml-2",
                    md: "ml-1 md:ml-2",
                    lg: "ml-1 lg:ml-2",
                    xl: "ml-1 xl:ml-2",
                    "2xl": "ml-1 2xl:ml-2",
                  };
                  return leftMarginByBreakpoint[hideTextBelow];
                })()}
              >
                {getResponsiveIconClass(icon)}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
