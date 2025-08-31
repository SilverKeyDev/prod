import React from "react";

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

const FormField = ({
  label,
  children,
  error,
  required = false,
  className = '',
  labelClassName = ''
}: FormFieldProps) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={`block text-navy font-medium mb-2 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormField;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

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

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

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
