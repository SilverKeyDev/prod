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
  /** Associates the label with the control (`htmlFor`). Prefer when the child input sets matching `id`. */
  htmlFor?: string;
  /** Optional id for the label element (for `aria-labelledby` from a composite control). */
  labelId?: string;
};

/**
 * Thin label + children + error stack. For full field chrome (icons, helper, password toggle),
 * prefer `Input` or `FieldShell` on web.
 */
const FormField = ({
  label,
  children,
  error,
  required = false,
  className = "",
  labelClassName = "",
  htmlFor,
  labelId: labelIdProp,
}: FormFieldProps) => {
  const reactId = React.useId();
  const errorId = `sk-formfield-error-${reactId.replace(/:/g, "")}`;
  const labelId =
    labelIdProp ?? (label ? `sk-formfield-label-${reactId.replace(/:/g, "")}` : undefined);

  return (
    <Box className={`mb-4 ${className}`}>
      {label && (
        <Label
          id={labelId}
          htmlFor={htmlFor}
          className={`text-text-primary mb-2 block font-medium ${labelClassName}`}
          required={required}
        >
          {label}
        </Label>
      )}
      {children}
      {error && (
        <BodyText id={errorId} size="xs" className="text-destructive mt-1" role="alert">
          {error}
        </BodyText>
      )}
    </Box>
  );
};

export default FormField;

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
