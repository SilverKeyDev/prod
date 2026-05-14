/// <reference types="nativewind/types" />

import React, { forwardRef, useMemo } from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";

import { useLocalization } from "packages/contexts";
import { Box, Text } from "packages/ui/components/primitives";
import {
  getInputClasses,
  INPUT_ICON_GROUP_CLASSES,
  INPUT_LEFT_ICON_WRAPPER_CLASSES,
  INPUT_RIGHT_ICON_GROUP_WRAPPER_CLASSES,
} from "packages/ui/styles/variants/inputVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

import { useInputField } from "./useInputField";

type FormInputChrome = {
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
  /** Unified change handler (parity with primitives `Input`). */
  onValueChange?: (text: string) => void;
};

export type InputProps = FormInputChrome &
  Omit<TextInputProps, "size" | "children" | "secureTextEntry" | "onChange"> & {
    /** `"password"` maps to `secureTextEntry` when `showPasswordToggle` is off. */
    type?: "text" | "password" | "email" | "tel" | "url" | "search";
  };

function stringValue(v: TextInputProps["value"]): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

const Input = forwardRef<TextInput, InputProps>(function Input(
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
    className = "",
    type = "text",
    value,
    onChangeText,
    onValueChange,
    disabled,
    editable,
    placeholder,
    id: idProp,
    secureTextEntry: secureTextEntryProp,
    ...props
  },
  ref
) {
  const { t } = useLocalization();
  const secureFromType = type === "password";
  const secureTextEntry = secureTextEntryProp ?? secureFromType;

  const {
    controlId,
    helperId,
    errorId,
    ariaInvalid: _ariaInvalid,
    passwordVisible,
    togglePassword,
  } = useInputField({
    id: idProp,
    type,
    showPasswordToggle,
    secureTextEntry,
    error,
    helperText,
  });

  const isPasswordToggle =
    Boolean(showPasswordToggle) && (type === "password" || Boolean(secureTextEntry));

  const effectiveSecure =
    isPasswordToggle && !passwordVisible
      ? true
      : isPasswordToggle && passwordVisible
        ? false
        : secureTextEntry;

  const hasRightIcons = Boolean(rightIcon ?? (clearable || showPasswordToggle));
  const inputClassName = useMemo(
    () =>
      getInputClasses({
        variant,
        size,
        error: Boolean(error),
        hasLeftIcon: Boolean(leftIcon),
        hasRightIcons,
        className,
      }),
    [variant, size, error, leftIcon, hasRightIcons, className]
  );

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    onValueChange?.(text);
  };

  const isEditable = editable ?? !disabled;
  const strValue = stringValue(value);
  const a11yHint = [error, helperText && !error ? helperText : undefined]
    .filter(Boolean)
    .join(". ");

  return (
    <Box className={twMergeClasses("w-full")}>
      {label ? (
        <Text
          accessibilityRole="text"
          nativeID={`${controlId}-label`}
          className="text-text-primary mb-2 text-sm font-medium"
        >
          {label}
          {required ? " *" : ""}
        </Text>
      ) : null}

      <Box className="relative">
        {leftIcon ? <Box className={INPUT_LEFT_ICON_WRAPPER_CLASSES}>{leftIcon}</Box> : null}

        <TextInput
          {...props}
          ref={ref}
          nativeID={controlId}
          className={inputClassName}
          value={strValue}
          onChangeText={handleChangeText}
          editable={isEditable}
          placeholder={placeholder}
          secureTextEntry={effectiveSecure}
          accessibilityLabel={label}
          accessibilityLabelledBy={label ? `${controlId}-label` : undefined}
          accessibilityHint={a11yHint || undefined}
          accessibilityState={{ disabled: !isEditable }}
        />

        <Box className={INPUT_RIGHT_ICON_GROUP_WRAPPER_CLASSES}>
          <Box className={`${INPUT_ICON_GROUP_CLASSES} pointer-events-auto`}>
            {clearable && strValue.length > 0 && isEditable ? (
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Icon name="x" className="h-4 w-4" />}
                label={t("form.clear_aria")}
                onPress={onClear}
                className="rounded p-1"
                disabled={disabled}
              />
            ) : null}

            {isPasswordToggle ? (
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
                onPress={togglePassword}
                className="rounded p-1"
                disabled={disabled}
              />
            ) : null}

            {rightIcon && !clearable && !showPasswordToggle ? rightIcon : null}
          </Box>
        </Box>
      </Box>

      {helperText && !error ? (
        <BodyText id={helperId} size="xs" muted className="mt-1">
          {helperText}
        </BodyText>
      ) : null}

      {error ? (
        <BodyText id={errorId} size="xs" className="text-destructive mt-1" role="alert">
          {error}
        </BodyText>
      ) : null}
    </Box>
  );
});

Input.displayName = "Input";

export { Input };
export default Input;
