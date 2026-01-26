import React, { forwardRef } from "react";

import KeyTurnLoader from "../loading/KeyTurnLoader";

export type IconButtonProps = {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "olive";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon: React.ReactNode;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
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
      ...props
    },
    ref,
  ) => {
    // Base styles that apply to all icon buttons
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed";

    // Size variants for icon buttons (square) - using utilities.css classes
    const sizeStyles = {
      xs: "mobile-icon-xs text-responsive-xs",
      sm: "mobile-icon-sm text-responsive-xs",
      md: "mobile-icon-md text-responsive-sm",
      lg: "mobile-icon-lg text-responsive-sm",
      xl: "mobile-icon-xl text-responsive-md",
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

    // Color variants - using brand tokens to match Button component
    const variantStyles = {
      primary:
        "bg-brand-accent text-white hover:bg-brand-accent/90 focus:ring-brand-accent/20 disabled:bg-brand-accent/50 disabled:text-white/70",
      secondary:
        "bg-brand-tertiary text-brand-primary hover:bg-brand-tertiary/80 focus:ring-brand-tertiary/20 disabled:bg-brand-tertiary/50 disabled:text-brand-primary/50",
      outline:
        "border border-brand-accent text-brand-accent bg-white hover:bg-brand-accent hover:text-white focus:ring-brand-accent/20 disabled:border-brand-accent/30 disabled:text-brand-accent/30 disabled:hover:bg-white disabled:hover:text-brand-accent/30",
      ghost:
        "text-brand-accent hover:bg-brand-accent/10 focus:ring-brand-accent/20 disabled:text-brand-accent/30 disabled:hover:bg-transparent",
      danger:
        "bg-rose text-white hover:bg-rose-light focus:ring-rose/20 disabled:bg-rose/50 disabled:text-white/70",
      success:
        "bg-brand-secondary text-white hover:bg-brand-secondary/90 focus:ring-brand-secondary/20 disabled:bg-brand-secondary/50 disabled:text-white/70",
      warning:
        "bg-gold-muted text-white hover:bg-gold-muted/90 focus:ring-gold-muted/20 disabled:bg-gold-muted/50 disabled:text-white/70",
      info: "bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500/20 disabled:bg-neutral-600/50 disabled:text-white/70",
      olive:
        "bg-olive text-white hover:bg-olive-light focus:ring-olive/20 disabled:bg-olive/50 disabled:text-white/70",
    };

    // Touch-friendly class for mobile
    const touchFriendlyClass = "touch-manipulation active:scale-95";

    // Combine all classes
    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      roundedStyles[rounded],
      variantStyles[variant],
      touchFriendlyClass,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? <KeyTurnLoader message="" /> : icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
