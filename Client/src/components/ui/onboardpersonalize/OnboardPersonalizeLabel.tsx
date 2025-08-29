import React from "react";
import { Asterisk } from "lucide-react";

interface OnboardPersonalizeLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export const RequiredLabel: React.FC<OnboardPersonalizeLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-xs sm:text-sm md:text-base font-medium text-black mb-2 ${className}`}
  >
    {children}
    <Asterisk
      className="ml-1 inline-block h-3.5 w-3.5 align-[0.04em] text-rose-400/60"
      strokeWidth={3}
      aria-hidden="true"
    />
    <span className="sr-only">(required)</span>
  </label>
);

export const OptionalLabel: React.FC<OnboardPersonalizeLabelProps> = ({
  children,
  className = "",
  htmlFor,
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-xs sm:text-sm md:text-base font-medium text-black mb-2 ${className}`}
  >
    {children}
  </label>
);

const OnboardPersonalizeLabel: React.FC<OnboardPersonalizeLabelProps> = ({
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

export default OnboardPersonalizeLabel;
