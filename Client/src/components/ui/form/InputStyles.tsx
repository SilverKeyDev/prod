import React from "react";

// Export the shared styles function for use in other components
// Uses direct responsive classes exactly like onboarding components
export const getSharedInputTextStyles = () => {
  return `text-gray-600 text-xs sm:text-sm md:text-base text-left leading-tight disabled:text-gray-400`;
};

interface InputStylesProps {
  children: React.ReactNode;
  disabled?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
  type?:
    | "input"
    | "dropdown-trigger"
    | "dropdown-option"
    | "dropdown-container"
    | "shared-text";
  isSelected?: boolean;
  isFirstOption?: boolean;
}

const InputStyles: React.FC<InputStylesProps> = ({
  children,
  disabled = false,
  isOpen = false,
  onClick,
  className = "",
  type = "input",
  isSelected = false,
  isFirstOption = false,
}) => {
  const getStyles = () => {
    switch (type) {
      case "input":
        return `
          w-full h-12 px-4 border border-beige rounded-lg bg-white
          hover:bg-brown/5 transition-colors duration-150 touch-friendly mobile-input
          focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown        
          disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400
          transition-all duration-200
          ${getSharedInputTextStyles()}
        `;

      case "dropdown-trigger":
        return `
          w-full h-12 px-4 border border-beige rounded-lg
          bg-white
          focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown
          hover:border-brown/50 disabled:cursor-not-allowed
          transition-all duration-200
          disabled:bg-gray-50 disabled:text-gray-400
          flex items-center justify-between cursor-pointer touch-friendly mobile-input
          ${getSharedInputTextStyles()}
        `;

      case "dropdown-container":
        return `
          absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 
          rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto
        `;

      case "dropdown-option":
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
        return getSharedInputTextStyles();

      default:
        return "";
    }
  };

  if (type === "dropdown-trigger") {
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

  if (type === "dropdown-option") {
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

  if (type === "dropdown-container") {
    return (
      <div className={`${getStyles()} ${className}`} role="listbox">
        {children}
      </div>
    );
  }

  if (type === "input") {
    return <input className={`${getStyles()} ${className}`}>{children}</input>;
  }

  return <div className={`${getStyles()} ${className}`}>{children}</div>;
};

export default InputStyles;
