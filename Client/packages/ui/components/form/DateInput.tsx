import React, { forwardRef } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type DateInputProps = {
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  error?: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">;

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      label,
      required,
      className = "",
      id,
      value,
      onChange,
      min,
      max,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input";

    const variantStyles = {
      default:
        "border-border bg-background-surface hover:bg-accent-muted focus:ring-accent-muted focus:border-primary",
      mobile:
        "mobile-input border-border bg-background-surface hover:bg-accent-muted focus:ring-accent-muted focus:border-primary touch-friendly autofill-gold",
      compact:
        "border-border bg-background-surface hover:bg-accent-muted focus:ring-accent-muted focus:border-primary",
    };

    const sizeStyles = {
      sm: "h-9 px-3",
      md: "h-12 px-4",
      lg: "h-14 px-5",
    };

    const errorStyles = error
      ? "border-destructive focus:border-destructive focus:ring-destructive"
      : "";

    const inputClasses = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      getSharedInputTextStyles(),
      errorStyles,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label != null && (
          <Label htmlFor={id} required={required} className="mb-2">
            {label}
          </Label>
        )}
        {/* eslint-disable-next-line silverkey/no-primitive-components -- base date input */}
        <input
          ref={ref}
          type="date"
          id={id}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        {error != null && error !== "" && (
          <BodyText size="xs" className="text-destructive mt-1">
            {error}
          </BodyText>
        )}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export { DateInput };
export default DateInput;
