import React from "react";

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
export default function BodyText({
  children,
  size = "md",
  className = "",
  muted = false,
  as: Component = "p",
}: BodyTextProps) {
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
  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    colorClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={combinedClasses}>{children}</Component>;
}
