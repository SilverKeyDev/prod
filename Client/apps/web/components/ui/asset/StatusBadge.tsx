import React from "react";

export type StatusBadgeProps = {
  /** Status text to display */
  text: string;
  /** Status variant */
  variant?: "success" | "warning" | "error" | "info" | "processing" | "default";
  /** Badge size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Custom className */
  className?: string;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  variant = "default",
  size = "sm",
  className = "",
}) => {
  // Base styles
  const baseStyles = "inline-block px-2 py-1 rounded-full font-medium";

  // Size variants - mobile responsive
  const sizeStyles = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-xs px-2 py-1",
    md: "text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5",
    lg: "text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2",
  };

  // Variant styles matching existing patterns
  const variantStyles = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    processing: "bg-gold text-white",
    default: "bg-gray-100 text-gray-800",
  };

  // Combine all classes
  const badgeClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={badgeClasses}>{text}</span>;
};

export default StatusBadge;
