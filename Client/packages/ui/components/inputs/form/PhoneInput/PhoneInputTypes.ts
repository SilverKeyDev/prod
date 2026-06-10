/** Country code string (e.g. "US"). libphonenumber / react-phone-number-input use this. */
export type CountryCode = string;

export type PhoneInputProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  id?: string;
  name?: string;
  /** Web: passed to react-phone-number-input; native: ignored. */
  international?: boolean;
  /** Web only: inputMode="tel" */
  inputMode?: "tel" | "text";
  /** Web only: autoComplete="tel" */
  autoComplete?: string;
  /** Optional class for the container. */
  className?: string;
  /** Optional style for the container (web: CSSProperties; native: ViewStyle). */
  style?: object;
  /** Web: custom input component; native: unused. */
  inputComponent?: React.ComponentType<unknown>;
  /** Web: onFocus for wrapper; native: onFocus for TextInput. */
  onFocus?: (e: unknown) => void;
};
