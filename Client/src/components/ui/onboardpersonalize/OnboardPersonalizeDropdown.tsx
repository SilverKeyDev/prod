import React from 'react';
import { ChevronDown } from 'lucide-react';
import OnboardPersonalizeDropdownStyles from './OnboardPersonalizeDropdownStyles';

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
      {/* Main dropdown trigger */}
      <OnboardPersonalizeDropdownStyles
        type="trigger"
        disabled={disabled}
        isOpen={isOpen}
        onClick={onToggle}
      >
        <span className={!selectedOption ? 'text-gray-400' : ''}>
          {selectedOption ? selectedOption.label : placeholder || 'Select your ...'}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
        />
      </OnboardPersonalizeDropdownStyles>

      {/* Dropdown options */}
      {isOpen && !disabled && (
        <OnboardPersonalizeDropdownStyles type="container">
          {options.map((option, index) => {
            const isSelected = value === option.value;
            return (
              <OnboardPersonalizeDropdownStyles
                key={option.value}
                type="option"
                isSelected={isSelected}
                isFirstOption={index === 0}
                onClick={() => {
                  onChange(option.value);
                  onToggle();
                }}
              >
                {option.label}
              </OnboardPersonalizeDropdownStyles>
            );
          })}
        </OnboardPersonalizeDropdownStyles>
      )}
    </div>
  );
};

export default OnboardPersonalizeDropdown;
