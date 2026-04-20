/* eslint-disable silverkey/no-primitive-components -- base form primitives */
import React from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { Box } from "packages/ui/components/primitives";
import { INPUT_AUTOFILL_CLASS_NAME } from "packages/ui/styles/variants/inputVariants";

type FormFieldProps = {
  label?: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
};

const FormField = ({
  label,
  children,
  error,
  className = "",
  labelClassName = "",
}: FormFieldProps) => {
  return (
    <Box className={`mb-4 ${className}`}>
      {label && (
        <Label className={`text-text-primary mb-2 block font-medium ${labelClassName}`}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <BodyText size="xs" className="text-destructive mt-1">
          {error}
        </BodyText>
      )}
    </Box>
  );
};

export default FormField;

type InputProps = {
  error?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ error, className = "", ...props }: InputProps) {
  const baseClasses =
    "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-input-variant-focus-border transition-colors " +
    INPUT_AUTOFILL_CLASS_NAME;
  const errorClasses = error ? "border-neutral-600" : "border-border";

  return <input className={`${baseClasses} ${errorClasses} ${className}`} {...props} />;
}

type TextareaProps = {
  error?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  const baseClasses =
    "w-full border rounded-lg px-3 py-2 min-h-20 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-input-variant-focus-border transition-colors resize-vertical " +
    INPUT_AUTOFILL_CLASS_NAME;
  const errorClasses = error ? "border-neutral-600" : "border-border";

  return <textarea className={`${baseClasses} ${errorClasses} ${className}`} {...props} />;
}
