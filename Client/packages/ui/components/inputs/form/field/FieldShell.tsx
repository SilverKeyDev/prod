// src/components/ui/FieldShell.tsx
/** Web-only: uses `Label.web`, global PhoneInput styles in `packages/ui/styles/css/utilities.css`. */
import { useId, useMemo } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";
import {
  getWebFieldShellClasses,
  WEB_FORM_FIELD_SHELL_ICON_CLASSES,
} from "packages/ui/styles/variants/inputVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

type FieldShellProps = {
  id?: string;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
  fieldClassName?: string;
  children: ReactNode;
  variant?: "default" | "mobile" | "compact" | "search";
  size?: "sm" | "md" | "lg";
  required?: boolean;
};

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
  required = false,
}: FieldShellProps) {
  const reactId = useId();
  const helperId = `${id ?? "sk-field"}-helper-${reactId.replace(/:/g, "")}`;
  const errorId = `${id ?? "sk-field"}-error-${reactId.replace(/:/g, "")}`;

  const ariaDescribedBy = useMemo(() => {
    const parts: string[] = [];
    if (helperText && !error) parts.push(helperId);
    if (error) parts.push(errorId);
    return parts.length > 0 ? parts.join(" ") : undefined;
  }, [helperText, error, helperId, errorId]);

  const labelId = id && label ? `${id}-label` : undefined;

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
    <Box className={twMergeClasses("w-full space-y-1.5", className)}>
      {label && (
        <Label
          id={labelId}
          htmlFor={id}
          className="text-text-primary mb-1 block text-sm font-medium"
          required={required}
        >
          {label}
        </Label>
      )}

      <Box
        className={containerClasses}
        role={label && id ? "group" : undefined}
        aria-labelledby={labelId}
        aria-describedby={ariaDescribedBy}
      >
        <Box className={fieldClasses}>
          <Box className="nested-input flex h-full w-full items-center">{children}</Box>
        </Box>

        {leftIcon && <Box className={iconClasses.left}>{leftIcon}</Box>}

        {rightIcon && (
          <Box className={iconClasses.right}>
            <Box className="flex items-center space-x-1">{rightIcon}</Box>
          </Box>
        )}
      </Box>

      {helperText && !error && (
        <BodyText id={helperId} size="xs" muted className="mt-1">
          {helperText}
        </BodyText>
      )}

      {error && (
        <BodyText id={errorId} size="xs" className="text-destructive mt-1" role="alert">
          {error}
        </BodyText>
      )}
    </Box>
  );
}
