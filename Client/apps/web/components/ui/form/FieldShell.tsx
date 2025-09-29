// src/components/ui/FieldShell.tsx
import type { ReactNode } from "react";

type FieldShellProps = {
  id?: string;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  helperText?: string;
  className?: string; // wrapper
  fieldClassName?: string; // inner field bar
  children: ReactNode; // your custom input goes here
  variant?: "default" | "mobile" | "compact" | "search";
  size?: "sm" | "md" | "lg";
  required?: boolean;
};

// Minimal class combiner (falsy values are ignored)
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function FieldShell({
  id,
  label,
  leftIcon,
  rightIcon,
  error,
  helperText,
  className,
  fieldClassName,
  children,
  variant = "mobile",
  size = "md",
  required,
}: FieldShellProps) {
  // Base styles - enhanced for nested component support
  const baseStyles =
    "w-full border rounded-lg transition-all duration-200 focus-within:outline-none focus-within:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-150 touch-friendly mobile-input group";

  // Variant styles - enhanced for nested component hover support
  const variantStyles = {
    default:
      "border-beige bg-white hover:bg-brown/5 focus-within:ring-brown/20 focus-within:border-brown",
    mobile:
      "mobile-input border-beige bg-white hover:bg-brown/5 focus-within:ring-brown/20 focus-within:border-brown touch-friendly autofill-parent",
    compact:
      "border-beige bg-white hover:bg-brown/5 focus-within:ring-brown/20 focus-within:border-brown",
    search:
      "border-beige bg-white hover:bg-brown/5 focus-within:ring-brown/20 focus-within:border-brown",
  };

  // Size styles - copied exactly from Input.tsx
  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-12 px-4",
    lg: "h-14 px-5",
  };

  // Error styles - copied exactly from Input.tsx
  const errorStyles = error
    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
    : "";

  // Container classes - copied exactly from Input.tsx
  const containerClasses = "relative";

  // Icon positioning classes - always visible, matches Input.tsx behavior with proper z-index
  const iconClasses = {
    left: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-1 pointer-events-none",
    right:
      "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-1 pointer-events-none",
  };

  // Combine all styles exactly like Input.tsx
  const fieldClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    errorStyles,
    leftIcon ? "has-left-icon" : "",
    rightIcon ? "has-right-icon" : "",
    fieldClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cx("w-full space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .autofill-parent {
            position: relative;
          }
          
          /* FieldShell autofill styling - apply to field container only, not label */
          .autofill-parent:has(.PhoneInputInput:-webkit-autofill) > div:last-child > div:first-child {
            background-color: hsl(42, 45%, 92%) !important;
            -webkit-box-shadow: 0 0 0 30px hsl(42, 45%, 92%) inset !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
          
          .autofill-parent:has(.PhoneInputInput:-moz-autofill) > div:last-child > div:first-child {
            background-color: hsl(42, 45%, 92%) !important;
          }
          
          /* PhoneInput autofill styling - match Input component behavior */
          .autofill-parent .PhoneInputInput:-webkit-autofill,
          .autofill-parent .PhoneInputInput:-webkit-autofill:hover,
          .autofill-parent .PhoneInputInput:-webkit-autofill:focus,
          .autofill-parent .PhoneInputInput:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px hsl(42, 45%, 92%) inset !important;
            -webkit-text-fill-color: hsl(25, 25%, 30%) !important;
            caret-color: hsl(25, 25%, 30%) !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
          
          /* Firefox autofill support */
          .autofill-parent .PhoneInputInput:-moz-autofill {
            background-color: hsl(42, 45%, 92%) !important;
            color: hsl(25, 25%, 30%) !important;
          }
          
          /* PhoneInput container styling */
          .group .PhoneInput {
            width: 100% !important;
            height: 100% !important;
            background: transparent !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            position: relative !important;
            z-index: 2 !important;
          }
          
          .group .PhoneInputInput {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            cursor: text !important;
            pointer-events: auto !important;
            z-index: 2 !important;
            position: relative !important;
          }
          
          /* Focus and selection styling */
          .group:focus-within {
            border-color: rgb(120 53 15) !important;
            box-shadow: 0 0 0 2px rgb(120 53 15 / 0.2) !important;
          }
          
          /* Selection color matching Input.tsx */
          .group .PhoneInputInput::selection {
            background-color: rgb(120 53 15 / 0.2);
            color: rgb(120 53 15);
          }
          
          /* Placeholder styling matching Input.tsx */
          .group .PhoneInputInput::placeholder {
            color: rgb(156 163 175) !important; /* text-gray-400 */
          }
          .group .PhoneInputInput::-webkit-input-placeholder {
            color: rgb(156 163 175) !important;
          }
          .group .PhoneInputInput::-moz-placeholder {
            color: rgb(156 163 175) !important;
            opacity: 1;
          }
          .group .PhoneInputInput:-ms-input-placeholder {
            color: rgb(156 163 175) !important;
          }

        `,
        }}
      />

      {/* Input Container - copied exactly from Input.tsx */}
      <div className={containerClasses}>
        {/* Field Container with exact Input.tsx styling */}
        <div className={fieldClasses}>
          <div className="nested-input flex h-full w-full items-center">
            {children}
          </div>
        </div>

        {/* Left Icon - always visible on top of input */}
        {leftIcon && <div className={iconClasses.left}>{leftIcon}</div>}

        {/* Right Icon - always visible on top of input */}
        {rightIcon && (
          <div className={iconClasses.right}>
            <div className="flex items-center space-x-1">{rightIcon}</div>
          </div>
        )}
      </div>

      {/* Helper Text - copied exactly from Input.tsx */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Error Message - copied exactly from Input.tsx */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
