import React, { forwardRef } from "react";

import { StyleSheet, TextInput as RNTextInput, type TextInputProps } from "react-native";

import { color } from "packages/design-tokens";

export type InputProps = TextInputProps & {
  onValueChange?: (text: string) => void;
  /** Unified a11y: maps to accessibilityLabel. Prefer over accessibilityLabel in feature code. */
  label?: string;
};

/**
 * Base Input primitive — TextInput for React Native.
 * Web uses <input> (Input.web.tsx). Use onValueChange for unified change handling.
 * Uses StyleSheet for reliable border/background (NativeWind className can be unreliable on TextInput).
 */
const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { className, style, onChangeText, onValueChange, label, accessibilityLabel, ...props },
  ref
) {
  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    onValueChange?.(text);
  };

  const baseClassName =
    "w-full rounded-lg border border-border bg-background-surface px-4 py-3 text-text-primary";
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <RNTextInput
      ref={ref}
      className={combinedClassName}
      style={[styles.input, style]}
      onChangeText={handleChangeText}
      placeholderTextColor={color("neutral.400")}
      accessibilityLabel={label ?? accessibilityLabel}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: color("neutral.300"),
    borderRadius: 10,
    backgroundColor: color("neutral.50"),
    color: color("neutral.800"),
    fontSize: 16,
  },
});

export default Input;
