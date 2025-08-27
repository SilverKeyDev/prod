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
}: AuthInputProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-xs font-medium text-black mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`input-field ${Icon ? 'pl-10' : 'pl-3'} h-12 text-sm border-gray-300 focus:border-brown focus:ring-brown/20`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
      </div>
    </div>
  );
}
