/* eslint-disable silverkey/no-primitive-components -- base form primitives */
import React from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

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
  required = false,
  className = "",
  labelClassName = "",
}: FormFieldProps) => {
  const { t } = useLocalization();
  return (
    <Box className={`mb-4 ${className}`}>
      {label && (
        <Label className={`text-text-primary mb-2 block font-medium ${labelClassName}`}>
          {label}
          {required && (
            <BodyText as="span" className="text-destructive ml-1" aria-hidden="true">
              {t("form.required_indicator")}
            </BodyText>
          )}
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
    "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-muted focus:border-primary transition-colors";
  const errorClasses = error ? "border-destructive" : "border-border";

  return <input className={`${baseClasses} ${errorClasses} ${className}`} {...props} />;
}

type TextareaProps = {
  error?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  const baseClasses =
    "w-full border rounded-lg px-3 py-2 min-h-20 focus:outline-none focus:ring-2 focus:ring-accent-muted focus:border-primary transition-colors resize-vertical";
  const errorClasses = error ? "border-destructive" : "border-border";

  return <textarea className={`${baseClasses} ${errorClasses} ${className}`} {...props} />;
}
