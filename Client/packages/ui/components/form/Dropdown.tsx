import React, { useCallback, useEffect, useRef, useState } from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
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
  const optionMeasureRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const [wrappingOptionIndices, setWrappingOptionIndices] = useState<Set<number>>(new Set());
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
  // Measure which option labels wrap to two lines so we can use slightly smaller text
  const checkOptionWraps = useCallback(() => {
    const next = new Set<number>();
    Object.entries(optionMeasureRefs.current).forEach(([iStr, el]) => {
      if (!el) return;
      const index = Number(iStr);
      if (Number.isNaN(index)) return;
      const style = getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const singleLineHeight = Number.isFinite(lineHeight)
        ? lineHeight
        : parseFloat(style.fontSize) * 1.2;
      if (el.scrollHeight > singleLineHeight * 1.5) next.add(index);
    });
    setWrappingOptionIndices(next);
  }, []);
  const setOptionMeasureRef = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      optionMeasureRefs.current[index] = el;
    },
    []
  );
  // Filter options based on search term (must be defined before useEffects that depend on it)
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;
  useEffect(() => {
    if (!isOpen) {
      setWrappingOptionIndices(new Set());
      return;
    }
    checkOptionWraps();
  }, [isOpen, checkOptionWraps, filteredOptions.length]);
  useEffect(() => {
    if (!isOpen) return;
    const refs = optionMeasureRefs.current;
    const observers: ResizeObserver[] = [];
    Object.keys(refs).forEach((iStr) => {
      const el = refs[Number(iStr)];
      if (!el) return;
      const observer = new ResizeObserver(checkOptionWraps);
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [isOpen, checkOptionWraps, filteredOptions]);
  // Variant styles - using exact onboarding styling
  const variantStyles = {
    default:
      "border-border bg-background-surface hover:border-border focus:ring-accent-muted focus:border-primary",
    mobile:
      "mobile-input border-border bg-background-surface hover:border-border focus:ring-accent-muted focus:border-primary touch-friendly",
    compact:
      "border-border bg-background-surface hover:border-border focus:ring-accent-muted focus:border-primary",
  };
  // Size styles - using exact onboarding sizing
  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-12 px-4",
    lg: "h-14 px-5",
  };
  // Error styles
  const errorStyles = error
    ? "border-destructive focus:border-destructive focus:ring-destructive"
    : "";
  // Disabled styles
  const disabledStyles = disabled
    ? "bg-disabled text-text-disabled cursor-not-allowed"
    : "cursor-pointer";
  // Button classes - using exact onboarding styling with InputStyles
  const buttonClasses = [
    "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2",
    "flex items-center !justify-between cursor-pointer touch-friendly mobile-input",
    "disabled:bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
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
    "absolute top-full left-0 right-0 mt-1 bg-background-surface border border-border",
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
    <Box className="w-full">
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
      <Box className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleToggle}
          disabled={disabled}
          className={`${buttonClasses} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {/* Label/placeholder bound left */}
          <BodyText
            as="span"
            ref={triggerLabelRef}
            className={`relative min-w-0 flex-1 truncate text-left ${
              selectedOption ? "text-gray-600" : "!text-gray-400"
            } ${labelWraps ? "text-xs" : ""}`}
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

          {/* Arrow and clear bound right */}
          <Box className="flex shrink-0 items-center gap-1">
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
            <Icon
              name="chevron-down"
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 transform" : ""}`}
            />
          </Box>
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <Box className={dropdownClasses}>
            {/* Search Input */}
            {searchable && (
              <Box className="border-border border-b p-2">
                <Box className="relative">
                  <Icon
                    name="search"
                    className="text-text-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
                  />
                  {/* eslint-disable-next-line silverkey/no-primitive-components -- search filter input */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={t("form.search_options")}
                    className={`border-border hover:border-border focus:border-primary focus:ring-accent-muted placeholder:text-text-secondary w-full rounded border py-2 pl-9 pr-3 transition-all duration-200 focus:outline-none focus:ring-2 ${(getSharedInputTextStyles as () => string)()}`}
                  />
                </Box>
              </Box>
            )}

            {/* Options List */}
            <Box>
              {filteredOptions.length === 0 ? (
                <Box className="text-text-secondary px-3 py-2 text-sm">
                  {searchable ? "No options found" : "No options available"}
                </Box>
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
                        ? "text-text-disabled cursor-not-allowed"
                        : "text-text-secondary hover:text-text-primary cursor-pointer hover:bg-neutral-50"
                    } ${option.value === value ? "bg-primary-muted text-text-primary font-medium" : ""} ${index > 0 ? "border-border border-t" : ""} hover:font-normal focus:bg-neutral-50 active:bg-neutral-100`}
                  >
                    <Box className="relative flex min-w-0 flex-1 items-center gap-2">
                      <BodyText
                        as="span"
                        ref={setOptionMeasureRef(index)}
                        aria-hidden
                        className="pointer-events-none absolute inset-0 overflow-hidden text-transparent"
                        style={{ visibility: "hidden" }}
                      >
                        {option.label}
                      </BodyText>
                      <BodyText
                        as="span"
                        size={wrappingOptionIndices.has(index) ? "sm" : "md"}
                        className="relative z-10 flex items-center"
                      >
                        {option.icon}
                        {option.label}
                      </BodyText>
                    </Box>
                    {option.value === value && (
                      <Icon name="check" className="text-primary h-4 w-4" />
                    )}
                  </Button>
                ))
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <BodyText size="xs" className="mt-1 text-red-600">
          {error}
        </BodyText>
      )}
    </Box>
  );
}
export default Dropdown;
