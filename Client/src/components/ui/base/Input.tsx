import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { getSharedInputTextStyles } from "./InputStyles";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "default" | "mobile" | "compact" | "search";
  size?: "sm" | "md" | "lg";
  error?: string;
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  helperText?: string;
  showPasswordToggle?: boolean;
  // Enhanced icon support
  iconSize?: "xs" | "sm" | "md" | "lg";
  iconColor?: string;
  iconPosition?: "left" | "right";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      label,
      required,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      helperText,
      showPasswordToggle,
      className = "",
      type = "text",
      value,
      onChange,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalType, setInternalType] = useState(type);

    // Handle password visibility toggle
    React.useEffect(() => {
      if (showPasswordToggle && type === "password") {
        setInternalType(showPassword ? "text" : "password");
      }
    }, [showPassword, showPasswordToggle, type]);

    // Base styles - using exact onboarding styling via InputStyles
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-150 touch-friendly mobile-input";

    // Variant styles - using exact onboarding styling
    const variantStyles = {
      default:
        "border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown",
      mobile:
        "mobile-input border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown touch-friendly autofill-gold",
      compact:
        "border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown",
      search:
        "border-beige bg-white hover:bg-brown/5 focus:ring-brown/20 focus:border-brown",
    };

    // Size styles - using exact onboarding sizing
    const sizeStyles = {
      sm: "h-9 px-3",
      md: "h-12 px-4",
      lg: "h-14 px-5",
    };

    // Error styles
    const errorStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "";

    // Disabled styles - already included in base styles
    const disabledStyles = "";

    // Combine all styles with shared text styles
    const inputClasses = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      getSharedInputTextStyles(),
      errorStyles,
      disabledStyles,
      leftIcon ? "pl-10 sm:pl-11 md:pl-12" : "",
      rightIcon || clearable || showPasswordToggle
        ? "pr-10 sm:pr-11 md:pr-12"
        : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Container classes for positioning icons
    const containerClasses = "relative";

    // Icon positioning classes
    const iconClasses = {
      left: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
      right:
        "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400",
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className={containerClasses}>
          {/* Left Icon */}
          {leftIcon && <div className={iconClasses.left}>{leftIcon}</div>}

          {/* Input Field */}
          <input
            ref={ref}
            type={internalType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClasses}
            {...props}
          />

          {/* Right Icons */}
          <div className={iconClasses.right}>
            <div className="flex items-center space-x-1">
              {/* Clear Button */}
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  tabIndex={-1}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Password Toggle */}
              {showPasswordToggle && type === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Custom Right Icon */}
              {rightIcon && !clearable && !showPasswordToggle && rightIcon}
            </div>
          </div>
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
