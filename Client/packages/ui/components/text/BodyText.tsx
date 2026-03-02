import React, { forwardRef } from "react";

export type BodyTextSize = "xs" | "sm" | "md" | "lg";

export type BodyTextProps = {
  children: React.ReactNode;
  size?: BodyTextSize;
  className?: string;
  /**
   * Muted variant for less prominent text
   */
  muted?: boolean;
  /**
   * HTML element to render. Defaults to "p" for paragraph.
   */
  as?: "p" | "span" | "div";
  /**
   * Native title (e.g. for tooltip when as="span")
   */
  title?: string;
  style?: React.CSSProperties;
};

/**
 * Standardized Body Text component.
 *
 * Responsive body text with consistent sizing, line-height, and spacing.
 * Mobile-optimized with responsive text sizing.
 *
 * @example
 * ```tsx
 * <BodyText size="md">This is body text</BodyText>
 * <BodyText size="sm" muted>This is muted text</BodyText>
 * ```
 */
const BodyText = forwardRef<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement, BodyTextProps>(
  (
    { children, size = "md", className = "", muted = false, as: Component = "p", title, style },
    ref
  ) => {
    // Base styles
    const baseClasses = "font-normal leading-relaxed";

    // Size classes - responsive
    const sizeClasses: Record<BodyTextSize, string> = {
      xs: "text-xs sm:text-sm",
      sm: "text-sm sm:text-base",
      md: "text-base sm:text-lg",
      lg: "text-lg sm:text-xl",
    };

    // Color classes
    const colorClass = muted ? "text-gray-600" : "text-gray-900";

    // Combine all classes
    const combinedClasses = [baseClasses, sizeClasses[size], colorClass, className]
      .filter(Boolean)
      .join(" ");

    return (
      <Component ref={ref} className={combinedClasses} title={title} style={style}>
        {children}
      </Component>
    );
  }
);

BodyText.displayName = "BodyText";

export default BodyText;
