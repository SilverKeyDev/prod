// src/components/ui/FieldShell.tsx
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import type { ReactNode } from "react";

import { Box } from "packages/ui/components/primitives";
import {
  getWebFieldShellClasses,
  WEB_FORM_FIELD_SHELL_ICON_CLASSES,
} from "packages/ui/styles/variants/inputVariants";

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
  const iconClasses = WEB_FORM_FIELD_SHELL_ICON_CLASSES;
  const containerClasses = "relative";
  const fieldClasses = getWebFieldShellClasses({
    variant,
    size,
    error,
    leftIcon: Boolean(leftIcon),
    rightIcon: Boolean(rightIcon),
    fieldClassName,
  });

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
