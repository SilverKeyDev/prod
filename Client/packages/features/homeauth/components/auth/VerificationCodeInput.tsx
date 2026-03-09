import React, { useEffect, useRef, useState } from "react";

import Input from "@ui/form/Input";

import BodyText from "packages/ui/components/text/BodyText";
import Label from "packages/ui/components/text/Label.web";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type VerificationCodeInputProps = {
  length?: number;
  label?: string;
  helperText?: string;
  error?: string;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

/**
 * A modern multi-cell verification / OTP input.
 *
 * Renders a row of individual inputs that together represent a single code string.
 * Intended for short numeric codes like 6‑digit verification codes.
 */
export default function VerificationCodeInput({
  length = 6,
  label,
  helperText,
  error,
  value = "",
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: VerificationCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length }, (_, index) => value[index] ?? "")
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Keep internal state in sync when the controlled value changes from outside
  useEffect(() => {
    setDigits(Array.from({ length }, (_, index) => value[index] ?? ""));
  }, [value, length]);

  const sharedInputTextStyles = getSharedInputTextStyles();

  const focusInput = (index: number) => {
    const input = inputsRef.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleChange = (index: number, nextChar: string) => {
    if (disabled) return;

    // Only allow digits 0-9
    const char = nextChar.slice(-1);
    if (char && !/^\d$/.test(char)) {
      return; // Ignore non-numeric characters
    }

    const nextDigits = [...digits];
    nextDigits[index] = char;

    const nextCode = nextDigits.join("");
    setDigits(nextDigits);
    onChange?.(nextCode);

    // Move focus to next cell when user types a character
    if (char && index < length - 1) {
      focusInput(index + 1);
    }

    // When all cells are filled, trigger onComplete
    if (onComplete && nextCode.length === length && nextDigits.every(Boolean)) {
      onComplete(nextCode);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      const hasValue = !!digits[index];
      const nextDigits = [...digits];

      if (hasValue) {
        nextDigits[index] = "";
        setDigits(nextDigits);
        onChange?.(nextDigits.join(""));
      } else if (index > 0) {
        // Move back and clear previous cell
        focusInput(index - 1);
        const prevDigits = [...digits];
        prevDigits[index - 1] = "";
        setDigits(prevDigits);
        onChange?.(prevDigits.join(""));
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    event.preventDefault();
    // Filter to only allow digits 0-9
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const nextDigits = Array.from({ length }, (_, index) => pasted[index] ?? "");
    const nextCode = nextDigits.join("");
    setDigits(nextDigits);
    onChange?.(nextCode);

    // Focus the last filled cell
    const lastFilledIndex = Math.min(pasted.length, length) - 1;
    if (lastFilledIndex >= 0) {
      focusInput(lastFilledIndex);
    }

    if (onComplete && nextCode.length === length && nextDigits.every(Boolean)) {
      onComplete(nextCode);
    }
  };

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusInput(0);
    }
    // We only want this to run once on mount when autoFocus is true
  }, [autoFocus, disabled]);

  return (
    <div className="w-full">
      {label && <Label className="mb-2 block text-sm font-medium text-gray-700">{label}</Label>}

      <div className="gap-responsive-sm sm:gap-responsive-md flex justify-between">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el as HTMLInputElement | null;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digits[index] ?? ""}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            disabled={disabled}
            className={[
              "h-14 w-10 border-0 border-b-2 bg-transparent text-center tracking-widest sm:h-16 sm:w-12 md:h-20 md:w-14",
              "focus:border-olive border-gray-400 focus:outline-none focus:ring-0",
              "pb-0 text-[1.40625rem] font-bold leading-none sm:text-[1.6875rem] md:text-[2.25rem]",
              "rounded-none", // keep the underline look
              sharedInputTextStyles,
              disabled ? "cursor-not-allowed border-gray-300 text-gray-400" : "text-black",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      {helperText && !error && (
        <BodyText size="xs" muted className="mt-1">
          {helperText}
        </BodyText>
      )}

      {error && (
        <BodyText size="xs" className="mt-1 text-red-600">
          {error}
        </BodyText>
      )}
    </div>
  );
}
