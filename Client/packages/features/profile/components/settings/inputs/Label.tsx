import React from "react";

import BaseLabel from "@/components/ui/text/Label.web";
export type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};
const Label: React.FC<LabelProps> = ({
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
export const RequiredLabel: React.FC<LabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <Label
    htmlFor={htmlFor}
    className={`text-text-primary block text-xs font-medium sm:text-sm md:text-base ${className}`}
  >
    {children}
  </Label>
);
export const OptionalLabel: React.FC<LabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <Label
    htmlFor={htmlFor}
    className={`text-text-primary block text-xs font-medium sm:text-sm md:text-base ${className}`}
  >
    {children}
  </Label>
);
export const OnPerLabel: React.FC<LabelProps> = ({
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
export default Label;
