import React, { useId } from "react";

import Input from "./Input";

/** Single-field OTP / verification code control (one input). For per-digit boxes, extend or replace later. */
export type VerificationCodeInputProps = {
  /** Max characters accepted (and passed to `onComplete` when full). */
  length: number;
  /** Current code string (controlled). */
  value: string;
  onChange: (value: string) => void;
  /** Called once when `value` reaches `length` after a change. */
  onComplete?: (completedCode: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function VerificationCodeInput({
  length,
  value,
  onChange,
  onComplete,
  disabled = false,
  className = "",
}: VerificationCodeInputProps) {
  const id = useId();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, length);
    onChange(newValue);

    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  return (
    <VerificationCodeField
      id={id}
      length={length}
      value={value}
      disabled={disabled}
      className={className}
      onChange={handleChange}
    />
  );
}

type VerificationCodeFieldProps = {
  id: string;
  length: number;
  value: string;
  disabled: boolean;
  className: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function VerificationCodeField({
  id,
  length,
  value,
  disabled,
  className,
  onChange,
}: VerificationCodeFieldProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCorrect="off"
      spellCheck={false}
      aria-label={`Verification code, ${length} digits`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={`Enter ${length}-digit code`}
      maxLength={length}
      className={className}
    />
  );
}
