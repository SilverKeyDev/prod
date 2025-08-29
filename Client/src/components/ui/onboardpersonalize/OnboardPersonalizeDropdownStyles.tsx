import React from "react";
import { getSharedTextStyles } from './OnboardPersonalizeSharedStyles';

interface DropdownStylesProps {
  children: React.ReactNode;
  disabled?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'trigger' | 'option' | 'container' | 'shared-text';
  isSelected?: boolean;
  isFirstOption?: boolean;
}

const OnboardPersonalizeDropdownStyles: React.FC<DropdownStylesProps> = ({
  children,
  disabled = false,
  isOpen = false,
  onClick,
  className = "",
  type = "trigger",
  isSelected = false,
  isFirstOption = false,
}) => {
  const getStyles = () => {
    switch (type) {
      case "trigger":
        return `
          w-full h-12 px-4 border border-beige rounded-lg
          bg-white
          focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown
          hover:border-brown/50 disabled:cursor-not-allowed
          transition-all duration-200
          disabled:bg-gray-50 disabled:text-gray-400
          flex items-center justify-between cursor-pointer touch-friendly mobile-input
          ${getSharedTextStyles()}
        `;

      case "container":
        return `
          absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 
          rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto
        `;

      case "option":
        return `
          w-full px-4 py-3 text-left text-xs sm:text-sm md:text-base
          transition-colors duration-150 touch-friendly outline-none
          ${
            isSelected
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600"
          }
          hover:bg-gray-50 hover:text-gray-700 hover:font-normal
          active:bg-gray-100 focus:bg-gray-50
          ${!isFirstOption ? "border-t border-gray-200" : ""}
        `;

      case "shared-text":
        return `
          text-gray-600 text-xs sm:text-sm md:text-base text-left
          leading-tight
          disabled:text-gray-400
        `;

      default:
        return "";
    }
  };

  if (type === "trigger") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${getStyles()} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {children}
      </button>
    );
  }

  if (type === "option") {
    return (
      <button
        onClick={onClick}
        role="option"
        aria-selected={isSelected}
        className={`${getStyles()} ${className}`}
      >
        {children}
      </button>
    );
  }

  if (type === "container") {
    return (
      <div className={`${getStyles()} ${className}`} role="listbox">
        {children}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default OnboardPersonalizeDropdownStyles;
