import { useEffect, useId, useMemo, useState } from "react";

export type UseInputFieldOptions = {
  /** Explicit control id (must match label `htmlFor` when provided). */
  id?: string;
  type?: string;
  /** Web `password` or native `secureTextEntry` + toggle. */
  showPasswordToggle?: boolean;
  /** Native password field without explicit `type`. */
  secureTextEntry?: boolean;
  error?: string;
  helperText?: string;
};

export type UseInputFieldResult = {
  controlId: string;
  helperId: string;
  errorId: string;
  /** Space-separated ids for `aria-describedby`. */
  ariaDescribedBy: string | undefined;
  ariaInvalid: boolean;
  /** When password toggle is active, true means password is visible (plain text / not secure). */
  passwordVisible: boolean;
  togglePassword: () => void;
  /** Web: `"text" | "password"` for `<input type>`. */
  inputType: string;
};

/**
 * Headless field ids + password visibility for form `Input` (web and native).
 */
export function useInputField({
  id: idProp,
  type = "text",
  showPasswordToggle,
  secureTextEntry,
  error,
  helperText,
}: UseInputFieldOptions): UseInputFieldResult {
  const reactId = useId();
  const controlId = idProp ?? `sk-input-${reactId.replace(/:/g, "")}`;
  const helperId = `${controlId}-helper`;
  const errorId = `${controlId}-error`;

  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPasswordField =
    Boolean(showPasswordToggle) && (type === "password" || Boolean(secureTextEntry));

  useEffect(() => {
    if (!isPasswordField) {
      setPasswordVisible(false);
    }
  }, [isPasswordField, type, secureTextEntry, showPasswordToggle]);

  const inputType =
    isPasswordField && !passwordVisible
      ? "password"
      : isPasswordField && passwordVisible
        ? "text"
        : type;

  const ariaDescribedBy = useMemo(() => {
    const parts: string[] = [];
    if (helperText && !error) parts.push(helperId);
    if (error) parts.push(errorId);
    return parts.length > 0 ? parts.join(" ") : undefined;
  }, [helperText, error, helperId, errorId]);

  return {
    controlId,
    helperId,
    errorId,
    ariaDescribedBy,
    ariaInvalid: Boolean(error),
    passwordVisible,
    togglePassword: () => setPasswordVisible((v) => !v),
    inputType,
  };
}
