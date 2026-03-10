import React from "react";

import Input from "./Input";

export type VerificationCodeInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (completedCode: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Placeholder VerificationCodeInput component.
 * TODO: Implement proper verification code input with individual digit inputs.
 */
export default function VerificationCodeInput({
  length,
  value,
  onChange,
  onComplete,
  disabled = false,
  className = "",
}: VerificationCodeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, length);
    onChange(newValue);

    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={`Enter ${length}-digit code`}
      maxLength={length}
      className={className}
    />
  );
}
