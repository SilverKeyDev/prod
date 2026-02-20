import React from "react";

import { Asterisk } from "lucide-react";

import { Label } from "@/components/ui/index.web";

type OnPerLabelProps = {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
};

export const RequiredLabel: React.FC<OnPerLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <Label
    htmlFor={htmlFor}
    className={`mb-2 block text-xs font-medium text-black sm:text-sm md:text-base ${className}`}
  >
    {children}
    <Asterisk
      className="ml-1 inline-block h-3.5 w-3.5 align-[0.04em] text-rose-400/60"
      strokeWidth={3}
      aria-hidden="true"
    />
  </Label>
);

export const OptionalLabel: React.FC<OnPerLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <Label
    htmlFor={htmlFor}
    className={`mb-2 block text-xs font-medium text-black sm:text-sm md:text-base ${className}`}
  >
    {children}
  </Label>
);

const OnPerLabel: React.FC<OnPerLabelProps> = ({
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

export default OnPerLabel;
