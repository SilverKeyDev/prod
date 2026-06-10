import "react-phone-number-input/style.css";

import React from "react";

import LibPhoneInput from "react-phone-number-input";

import type { PhoneInputProps } from "./PhoneInputTypes";

/**
 * Web: wraps react-phone-number-input with shared props interface.
 */
function PhoneInputWeb({
  value,
  onChange,
  defaultCountry = "US",
  placeholder = "Enter phone number",
  id,
  name,
  international = true,
  inputMode = "tel",
  autoComplete = "tel",
  className,
  style,
  inputComponent,
  onFocus,
}: PhoneInputProps) {
  return (
    <LibPhoneInput
      international={international}
      defaultCountry={defaultCountry as "US"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      name={name}
      inputMode={inputMode}
      autoComplete={autoComplete}
      className={className}
      style={style as React.CSSProperties}
      inputComponent={inputComponent}
      onFocus={onFocus as (e: React.FocusEvent<HTMLDivElement>) => void}
    />
  );
}

export default PhoneInputWeb;
export { PhoneInputWeb as PhoneInput };
