import React, { useCallback, useEffect, useRef, useState } from "react";

import Button from "@ui/button/Button";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import { Check, ChevronDown, Search } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { getDocument } from "packages/utils/platform";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type DropdownOption<T = unknown> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export type DropdownProps<T = unknown> = {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string | undefined;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  className?: string;
  dropdownClassName?: string;
  onClear?: () => void;
};

function Dropdown<T = unknown>({
  options,
  value,
  onChange,
  placeholder,
  label,
  required,
  error,
  disabled,
  searchable = false,
  clearable = false,
  variant = "default",
  size = "md",
  className = "",
  dropdownClassName = "",
  onClear,
}: DropdownProps<T>) {
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [labelWraps, setLabelWraps] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerLabelRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Find selected option
  const selectedOption = options.find((option) => option.value === value);

  const displayLabel = selectedOption
    ? selectedOption.label
    : (placeholder ?? t("form.select_option"));

  // Detect wrap using a hidden element that always has default (unshrunk) font size,
  // so changing the visible text size doesn't flip the measurement and cause glitching.
  const checkLabelWrap = useCallback(() => {
    const measureEl = measureRef.current;
    if (!measureEl) return;
    const style = getComputedStyle(measureEl);
    const lineHeight = parseFloat(style.lineHeight);
    const singleLineHeight = Number.isFinite(lineHeight)
      ? lineHeight
      : parseFloat(style.fontSize) * 1.2;
    const wraps = measureEl.scrollHeight > singleLineHeight * 1.5;
    setLabelWraps(wraps);
  }, []);

  useEffect(() => {
    checkLabelWrap();
  }, [displayLabel, checkLabelWrap]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkLabelWrap);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkLabelWrap]);

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  // Variant styles - using exact onboarding styling
  const variantStyles = {
    default: "border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown",
    mobile:
      "mobile-input border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown touch-friendly",
    compact: "border-beige bg-white hover:border-brown/50 focus:ring-brown/20 focus:border-brown",
  };

  // Size styles - using exact onboarding sizing
  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-12 px-4",
    lg: "h-14 px-5",
  };

  // Error styles
  const errorStyles = error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "";

  // Disabled styles
  const disabledStyles = disabled
    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
    : "cursor-pointer";

  // Button classes - using exact onboarding styling with InputStyles
  const buttonClasses = [
    "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2",
    "flex items-center justify-between cursor-pointer touch-friendly mobile-input",
    "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
    (getSharedInputTextStyles as () => string)(),
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
    "rounded-lg shadow-lg z-[9999]",
    dropdownClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // Handle click outside
  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      doc.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      doc.removeEventListener("mousedown", handleClickOutside);
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
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && (
            <BodyText as="span" className="text-red-500">
              {t("form.required_indicator")}
            </BodyText>
          )}
        </Label>
      )}

      {/* Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleToggle}
          disabled={disabled}
          className={`${buttonClasses} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <BodyText
            as="span"
            ref={triggerLabelRef}
            className={`relative min-w-0 flex-1 text-left ${selectedOption ? "text-gray-600" : "text-gray-400"} ${labelWraps ? "text-[13px]" : ""}`}
          >
            {displayLabel}
            {/* Hidden measurer: always default size so wrap detection is stable and doesn't glitch */}
            <BodyText
              as="span"
              ref={measureRef}
              aria-hidden
              className="absolute inset-0 w-full text-xs leading-tight text-transparent sm:text-sm md:text-base"
              style={{ visibility: "hidden", pointerEvents: "none" }}
            >
              {displayLabel}
            </BodyText>
          </BodyText>

          <div className="flex items-center gap-1">
            {clearable && selectedOption && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="cursor-pointer rounded p-1 transition-colors hover:bg-gray-100"
                tabIndex={-1}
                aria-label={t("form.clear_aria")}
              >
                {t("form.clear_aria")}
              </Button>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 transform" : ""
              }`}
            />
          </div>
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={dropdownClasses}>
            {/* Search Input */}
            {searchable && (
              <div className="border-b border-gray-100 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  {/* eslint-disable-next-line silverkey/no-primitive-components -- search filter input */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={t("form.search_options")}
                    className={`border-beige hover:border-brown/50 focus:border-brown focus:ring-brown/20 w-full rounded border py-2 pl-9 pr-3 transition-all duration-200 focus:outline-none focus:ring-2 ${(getSharedInputTextStyles as () => string)()}`}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchable ? "No options found" : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    onClick={() => handleOptionSelect(option)}
                    disabled={option.disabled}
                    className={`touch-friendly flex w-full items-center justify-between gap-2 px-4 py-4 text-left outline-none transition-colors duration-150 ${(getSharedInputTextStyles as () => string)()} ${
                      option.disabled
                        ? "cursor-not-allowed text-gray-400"
                        : "cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                    } ${
                      option.value === value ? "bg-gray-100 font-medium text-gray-900" : ""
                    } ${index > 0 ? "border-t border-gray-200" : ""} hover:font-normal focus:bg-gray-50 active:bg-gray-100`}
                  >
                    <BodyText as="span" className="flex items-center">
                      {option.icon}
                      {option.label}
                    </BodyText>
                    {option.value === value && <Check className="text-brown h-4 w-4" />}
                  </Button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <BodyText size="xs" className="mt-1 text-red-600">
          {error}
        </BodyText>
      )}
    </div>
  );
}

export default Dropdown;
