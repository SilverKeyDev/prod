import React, { forwardRef } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type TimeInputProps = {
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  error?: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">;

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
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
      disabled,
      min,
      max,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-150 touch-friendly mobile-input";

    const variantStyles = {
      default: "border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown",
      mobile:
        "mobile-input border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown touch-friendly autofill-gold",
      compact: "border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown",
    };

    const sizeStyles = {
      sm: "h-9 px-3",
      md: "h-12 px-4",
      lg: "h-14 px-5",
    };

    const errorStyles = error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "";

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
        {/* eslint-disable-next-line silverkey/no-primitive-components -- base time input */}
        <input
          ref={ref}
          type="time"
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          className={inputClasses}
          {...props}
        />
        {error != null && error !== "" && (
          <BodyText size="xs" className="mt-1 text-red-600">
            {error}
          </BodyText>
        )}
      </div>
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };
export default TimeInput;
