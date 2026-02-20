import React from "react";

import { useLocalization } from "packages/contexts";

export type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  id?: string;
  required?: boolean;
  variant?: "default" | "bold" | "medium" | "light";
  size?: "xs" | "sm" | "md" | "lg";
  color?: "default" | "black" | "gray" | "brown" | "error";
  className?: string;
  disabled?: boolean;
};

const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  id,
  required = false,
  variant = "default",
  size = "sm",
  color = "default",
  className = "",
  disabled = false,
}) => {
  const { t } = useLocalization();
  // Base styles
  const baseStyles = "block transition-colors duration-150";

  // Variant styles (font weight)
  const variantStyles = {
    default: "font-normal",
    light: "font-light",
    medium: "font-medium",
    bold: "font-semibold",
  };

  // Size styles
  const sizeStyles = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Color styles
  const colorStyles = {
    default: "text-gray-700",
    black: "text-black",
    gray: "text-gray-600",
    brown: "text-brown",
    error: "text-red-600",
  };

  // Disabled styles
  const disabledStyles = disabled ? "text-gray-400 cursor-not-allowed" : "";

  // Combine all styles
  const labelClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    colorStyles[color],
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label id={id} htmlFor={htmlFor} className={labelClasses}>
      {children}
      {required && (
        <span className="text-red-500" aria-hidden="true">
          {t("form.required_indicator")}
        </span>
      )}
    </label>
  );
};

export default Label;
