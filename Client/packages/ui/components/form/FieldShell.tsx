// src/components/ui/FieldShell.tsx
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import type { ReactNode } from "react";

import { Box } from "packages/ui/components/primitives";

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
}: FieldShellProps) {
  // Base styles - enhanced for nested component support
  const baseStyles =
    "w-full border rounded-lg transition-all duration-200 focus-within:outline-none focus-within:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input group";

  // Variant styles - enhanced for nested component hover support
  const variantStyles = {
    default:
      "border-border bg-background-surface hover:bg-accent-muted focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
    mobile:
      "mobile-input border-border bg-background-surface hover:bg-accent-muted focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border touch-friendly autofill-parent",
    compact:
      "border-border bg-background-surface hover:bg-accent-muted focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
    search:
      "border-border bg-background-surface hover:bg-accent-muted focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  };

  // Size styles - copied exactly from Input.tsx
  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-12 px-4",
    lg: "h-14 px-5",
  };

  // Error styles - copied exactly from Input.tsx
  const errorStyles = error
    ? "border-neutral-600 focus-within:border-neutral-700 focus-within:ring-neutral-400"
    : "";

  // Container classes - copied exactly from Input.tsx
  const containerClasses = "relative";

  // Icon positioning classes - always visible, matches Input.tsx behavior with proper z-index
  const iconClasses = {
    left: "absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary z-1 pointer-events-none",
    right:
      "absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary z-1 pointer-events-none",
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
    <Box className={cx("w-full space-y-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-text-primary mb-1 block text-sm font-medium">
          {label}
        </Label>
      )}
      {/* Security: static CSS only, no user or server data. Safe for dangerouslySetInnerHTML. */}
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
      <Box className={containerClasses}>
        {/* Field Container with exact Input.tsx styling */}
        <Box className={fieldClasses}>
          <Box className="nested-input flex h-full w-full items-center">{children}</Box>
        </Box>

        {/* Left Icon - always visible on top of input */}
        {leftIcon && <Box className={iconClasses.left}>{leftIcon}</Box>}

        {/* Right Icon - always visible on top of input */}
        {rightIcon && (
          <Box className={iconClasses.right}>
            <Box className="flex items-center space-x-1">{rightIcon}</Box>
          </Box>
        )}
      </Box>

      {/* Helper Text - copied exactly from Input.tsx */}
      {helperText && !error && (
        <BodyText size="xs" muted className="mt-1">
          {helperText}
        </BodyText>
      )}

      {/* Error Message - copied exactly from Input.tsx */}
      {error && (
        <BodyText size="xs" className="text-destructive mt-1">
          {error}
        </BodyText>
      )}
    </Box>
  );
}
