import React from "react";

import type { StyleProp, ViewStyle } from "react-native";
import RNPhoneInput from "react-native-phone-number-input";

import { spacing } from "packages/design-tokens";

import type { CountryCode, PhoneInputProps } from "./PhoneInputTypes";

/**
 * Native: react-native-phone-number-input with country picker; same value/onChange/defaultCountry API as web.
 */
export default function PhoneInputNative({
  value,
  onChange,
  defaultCountry = "US",
  placeholder = "Enter phone number",
  style,
  onFocus,
}: PhoneInputProps) {
  return (
    <RNPhoneInput
      defaultCode={(defaultCountry as CountryCode) ?? "US"}
      value={value ?? ""}
      onChangeFormattedText={(formatted) => onChange(formatted || undefined)}
      placeholder={placeholder}
      containerStyle={[{ minWidth: spacing(0) }, style as StyleProp<ViewStyle>]}
      textInputProps={{
        onFocus: onFocus as () => void,
      }}
      withDarkTheme={false}
      withShadow={false}
    />
  );
}
