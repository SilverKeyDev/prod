import React from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon?: LucideIcon;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  textSize?: "xs" | "sm" | "base" | "lg";
}

export default function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  name,
  autoComplete,
  required = false,
  className = "",
  textSize = "xs",
}: AuthInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-responsive-sm font-semibold text-black/60">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 mobile-icon-xs text-black/40" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`input-field ${Icon ? 'pl-10' : 'space-responsive-sm'} btn-responsive-md text-responsive-${textSize} text-black/40 border-gray-300 focus:border-brown focus:ring-brown/20 placeholder:font-light autofill-muted`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
      </div>
    </div>
  );
}
