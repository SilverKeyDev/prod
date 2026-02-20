import React from "react";

import { useLocalization } from "packages/contexts";

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
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={`mb-2 block font-medium text-navy ${labelClassName}`}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              {t("form.required_indicator")}
            </span>
          )}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;

type InputProps = {
  error?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ error, className = "", ...props }: InputProps) {
  const baseClasses =
    "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors";
  const errorClasses = error ? "border-red-500" : "border-beige";

  return (
    <input
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
}

type TextareaProps = {
  error?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  const baseClasses =
    "w-full border rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors resize-vertical";
  const errorClasses = error ? "border-red-500" : "border-beige";

  return (
    <textarea
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
}
