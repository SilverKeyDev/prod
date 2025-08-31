import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { getSharedInputTextStyles } from "./InputStyles";

export interface DropdownOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface DropdownProps<T = any> {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  maxHeight?: string;
  className?: string;
  dropdownClassName?: string;
  onClear?: () => void;
}

function Dropdown<T = any>({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  required,
  error,
  disabled,
  searchable = false,
  clearable = false,
  variant = "default",
  size = "md",
  maxHeight = "200px",
  className = "",
  dropdownClassName = "",
  onClear,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find((option) => option.value === value);

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Variant styles - using exact onboarding styling
  const variantStyles = {
    default:
      "border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown",
    mobile:
      "mobile-input border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown touch-friendly",
    compact:
      "border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown",
  };

  // Size styles - using exact onboarding sizing
  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-12 px-4",
    lg: "h-14 px-5",
  };

  // Error styles
  const errorStyles = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
    : "";

  // Disabled styles
  const disabledStyles = disabled
    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
    : "cursor-pointer";

  // Button classes - using exact onboarding styling with InputStyles
  const buttonClasses = [
    "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2",
    "flex items-center justify-between cursor-pointer touch-friendly mobile-input",
    "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
    getSharedInputTextStyles(),
    variantStyles[variant],
    sizeStyles[size],
    errorStyles,
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Dropdown classes - using exact onboarding styling
  const dropdownClasses = [
    "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300",
    "rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto",
    dropdownClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = (option: DropdownOption<T>) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange(undefined as T);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={buttonClasses}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            <span
              className={selectedOption ? "text-gray-600" : "text-gray-400"}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>

          <div className="flex items-center gap-1">
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                tabIndex={-1}
              >
                ×
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={dropdownClasses}>
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    className={`w-full pl-9 pr-3 py-2 border border-beige rounded focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown hover:border-brown/50 transition-all duration-200 ${getSharedInputTextStyles()}`}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto" style={{ maxHeight }}>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchable ? "No options found" : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    disabled={option.disabled}
                    className={`
                      w-full px-4 py-3 text-left
                      transition-colors duration-150 touch-friendly outline-none
                      flex items-center justify-between gap-2
                      ${getSharedInputTextStyles()}
                      ${
                        option.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                      }
                      ${
                        option.value === value
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : ""
                      }
                      ${index > 0 ? "border-t border-gray-200" : ""}
                      hover:font-normal active:bg-gray-100 focus:bg-gray-50
                    `}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon}
                      {option.label}
                    </span>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-brown" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Dropdown;
