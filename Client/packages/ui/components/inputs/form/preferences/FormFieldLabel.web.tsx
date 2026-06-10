import React from "react";

import BaseLabel from "packages/ui/components/structure/text/Label.web";

export type FormFieldLabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = "",
}) => {
  return (
    <BaseLabel
      htmlFor={htmlFor}
      required={required}
      variant="medium"
      size="sm"
      color="black"
      className={`mb-2 ${className}`}
    >
      {children}
    </BaseLabel>
  );
};

export const RequiredLabel: React.FC<FormFieldLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <FormFieldLabel
    htmlFor={htmlFor}
    className={`text-text-primary block text-xs font-medium sm:text-sm md:text-base ${className}`}
  >
    {children}
  </FormFieldLabel>
);

export const OptionalLabel: React.FC<FormFieldLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <FormFieldLabel
    htmlFor={htmlFor}
    className={`text-text-primary block text-xs font-medium sm:text-sm md:text-base ${className}`}
  >
    {children}
  </FormFieldLabel>
);

export const OnPerLabel: React.FC<FormFieldLabelProps> = ({
  children,
  required = false,
  className = "",
  htmlFor,
}) => {
  if (required) {
    return (
      <RequiredLabel htmlFor={htmlFor} className={className}>
        {children}
      </RequiredLabel>
    );
  }
  return (
    <OptionalLabel htmlFor={htmlFor} className={className}>
      {children}
    </OptionalLabel>
  );
};

export default FormFieldLabel;
