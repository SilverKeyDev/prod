import React from 'react';

interface OnboardPersonalizeInputProps {
  type?: 'text' | 'number' | 'email';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const OnboardPersonalizeInput: React.FC<OnboardPersonalizeInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  min,
  max,
  step,
  disabled = false,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`
        w-full px-4 py-3 border border-beige rounded-lg
        bg-white text-gray-600 text-xs sm:text-sm md:text-base
        focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown
        hover:border-brown/50
        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        transition-all duration-200
        mobile-input
        ${className}
      `}
    />
  );
};

export default OnboardPersonalizeInput;
