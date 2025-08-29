import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface OnboardPersonalizeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  className?: string;
  disabled?: boolean;
}

const OnboardPersonalizeDropdown: React.FC<OnboardPersonalizeDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  onToggle,
  dropdownRef,
  className = '',
  disabled = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          w-full h-12 px-4 border border-beige rounded-lg
          bg-white text-gray-600 text-xs sm:text-sm md:text-base text-left
          leading-tight
          focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown
          hover:border-brown/50
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          transition-all duration-200
          mobile-input
          flex items-center justify-between cursor-pointer touch-friendly
        `}
      >
        <span className="text-left truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                onToggle();
              }}
              className={`
                w-full px-4 py-3 text-left text-xs sm:text-sm md:text-base text-gray-600
                hover:bg-brown/5 transition-colors duration-150 touch-friendly
                ${index === 0 ? 'first:rounded-t-lg' : ''}
                ${index === options.length - 1 ? 'last:rounded-b-lg' : ''}
                ${value === option.value ? 'bg-brown/10 text-brown font-medium' : 'text-gray-600'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardPersonalizeDropdown;
