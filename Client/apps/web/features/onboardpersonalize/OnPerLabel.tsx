import { Asterisk } from "lucide-react";
import React from "react";

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
  <label
    htmlFor={htmlFor}
    className={`mb-2 block text-xs font-medium text-black sm:text-sm md:text-base ${className}`}
  >
    {children}
    <Asterisk
      className="ml-1 inline-block h-3.5 w-3.5 align-[0.04em] text-rose-400/60"
      strokeWidth={3}
      aria-hidden="true"
    />
    (required)
  </label>
);

export const OptionalLabel: React.FC<OnPerLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <label
    htmlFor={htmlFor}
    className={`mb-2 block text-xs font-medium text-black sm:text-sm md:text-base ${className}`}
  >
    {children}
  </label>
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
