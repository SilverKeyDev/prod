import React, { forwardRef, useState } from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import {
  getWebInputControlClasses,
  WEB_FORM_INPUT_ICON_CLASSES,
} from "packages/ui/styles/variants/inputVariants";
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
  // Enhanced icon support
  iconSize?: "xs" | "sm" | "md" | "lg";
  iconColor?: string;
  iconPosition?: "left" | "right";
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      label,
      required: _required,
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
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const { t } = useLocalization();
    const [showPassword, setShowPassword] = useState(false);
    const [internalType, setInternalType] = useState(type);
    // Handle password visibility toggle
    React.useEffect(() => {
      if (showPasswordToggle && type === "password") {
        setInternalType(showPassword ? "text" : "password");
      }
    }, [showPassword, showPasswordToggle, type]);
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
    return (
      <Box className="w-full">
        {/* Label */}
        {label && (
          <Label htmlFor={props.id} className="text-text-primary mb-2 block text-sm font-medium">
            {label}
          </Label>
        )}

        {/* Input Container */}
        <Box className={containerClasses}>
          {/* Left Icon */}
          {leftIcon && <Box className={iconClasses.left}>{leftIcon}</Box>}

          {/* Input Field */}
          {customInput ? (
            React.cloneElement(customInput, {
              className: inputClasses,
              ...props,
            })
          ) : (
            /* eslint-disable-next-line silverkey/no-primitive-components -- base input */
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
          )}

          {/* Right Icons */}
          <Box className={iconClasses.right}>
            <Box className="flex items-center space-x-1">
              {/* Clear Button */}
              {clearable && value && !disabled && (
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

              {/* Password Toggle */}
              {showPasswordToggle && type === "password" && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={
                    showPassword ? (
                      <Icon name="eye-off" className="h-4 w-4" />
                    ) : (
                      <Icon name="eye" className="h-4 w-4" />
                    )
                  }
                  label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded p-1 transition-colors hover:bg-neutral-100"
                  tabIndex={-1}
                />
              )}

              {/* Custom Right Icon */}
              {rightIcon && !clearable && !showPasswordToggle && rightIcon}
            </Box>
          </Box>
        </Box>

        {/* Helper Text */}
        {helperText && !error && (
          <BodyText size="xs" muted className="mt-1">
            {helperText}
          </BodyText>
        )}

        {/* Error Message */}
        {error && (
          <BodyText size="xs" className="text-destructive mt-1">
            {error}
          </BodyText>
        )}
      </Box>
    );
  }
);
Input.displayName = "Input";
// Export both named and default for compatibility
export { Input };
export default Input;
