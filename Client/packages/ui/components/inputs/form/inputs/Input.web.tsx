import React, { forwardRef } from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import {
  getWebInputControlClasses,
  WEB_FORM_INPUT_ICON_CLASSES,
} from "packages/ui/styles/variants/inputVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

import { useInputField } from "./useInputField";

export type InputProps = {
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
  customInput?: React.ReactElement;
  /** Unified change handler (parity with native form `Input`). */
  onValueChange?: (text: string) => void;
  /** React Native parity: `editable={false}` maps to `disabled` on web. */
  editable?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

function mergeDescribedBy(
  existing: string | undefined,
  added: string | undefined
): string | undefined {
  if (!added) return existing;
  if (!existing) return added;
  return `${existing} ${added}`.trim();
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      label,
      required = false,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      helperText,
      showPasswordToggle,
      customInput,
      className = "",
      type = "text",
      value,
      onChange,
      onValueChange,
      disabled,
      editable,
      placeholder,
      id: idProp,
      "aria-describedby": ariaDescribedByProp,
      "aria-invalid": ariaInvalidProp,
      ...props
    },
    ref
  ) => {
    const { t } = useLocalization();
    const {
      controlId,
      helperId,
      errorId,
      ariaDescribedBy,
      ariaInvalid,
      passwordVisible,
      togglePassword,
      inputType,
    } = useInputField({
      id: idProp,
      type,
      showPasswordToggle,
      error,
      helperText,
    });

    const hasRightIcons = Boolean(rightIcon ?? (clearable || showPasswordToggle));
    const inputClasses = getWebInputControlClasses({
      variant,
      size,
      error,
      hasLeftIcon: Boolean(leftIcon),
      hasRightIcons,
      className,
    });
    const containerClasses = "relative";
    const iconClasses = WEB_FORM_INPUT_ICON_CLASSES;

    const describedBy = mergeDescribedBy(ariaDescribedByProp, ariaDescribedBy);
    const invalid = ariaInvalidProp ?? ariaInvalid;
    const isDisabled = !(editable ?? !disabled);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onValueChange?.(e.currentTarget.value);
    };

    const inputAriaProps: Pick<
      React.InputHTMLAttributes<HTMLInputElement>,
      "id" | "aria-describedby" | "aria-invalid"
    > = {
      id: controlId,
      "aria-describedby": describedBy,
      ...(invalid ? { "aria-invalid": true } : {}),
    };

    return (
      <Box className={twMergeClasses("w-full")}>
        {label && (
          <Label
            htmlFor={controlId}
            className="text-text-primary mb-2 block text-sm font-medium"
            required={required}
          >
            {label}
          </Label>
        )}

        <Box className={containerClasses}>
          {leftIcon && <Box className={iconClasses.left}>{leftIcon}</Box>}

          {customInput ? (
            React.cloneElement(customInput, {
              ...props,
              ...inputAriaProps,
              value,
              onChange: handleChange,
              disabled: isDisabled,
              "aria-describedby": mergeDescribedBy(
                customInput.props["aria-describedby"] as string | undefined,
                describedBy
              ),
              "aria-invalid":
                ((customInput.props["aria-invalid"] as boolean | undefined) ?? invalid)
                  ? true
                  : undefined,
              className: twMergeClasses(inputClasses, customInput.props.className as string),
            } as Record<string, unknown>)
          ) : (
            /* eslint-disable-next-line silverkey/no-primitive-components -- base input */
            <input
              ref={ref}
              type={inputType}
              value={value}
              onChange={handleChange}
              disabled={isDisabled}
              placeholder={placeholder}
              className={inputClasses}
              {...props}
              {...inputAriaProps}
            />
          )}

          <Box className={iconClasses.right}>
            <Box className="flex items-center space-x-1">
              {clearable && value && !isDisabled && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="x" className="h-4 w-4" />}
                  label={t("form.clear_aria")}
                  onClick={onClear}
                  className="rounded p-1 transition-colors hover:bg-neutral-100"
                  tabIndex={-1}
                />
              )}

              {showPasswordToggle && type === "password" && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={
                    passwordVisible ? (
                      <Icon name="eye-off" className="h-4 w-4" />
                    ) : (
                      <Icon name="eye" className="h-4 w-4" />
                    )
                  }
                  label={
                    passwordVisible ? t("form.password_hide_aria") : t("form.password_show_aria")
                  }
                  onClick={togglePassword}
                  className="rounded p-1 transition-colors hover:bg-neutral-100"
                  tabIndex={-1}
                />
              )}

              {rightIcon && !clearable && !showPasswordToggle && rightIcon}
            </Box>
          </Box>
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
);
Input.displayName = "Input";
export { Input };
export default Input;
