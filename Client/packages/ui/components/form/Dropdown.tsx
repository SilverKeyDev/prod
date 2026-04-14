import React, { useRef, useState } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { getDocument } from "packages/utils/platform";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

import type { DropdownOption } from "./Dropdown.types";
import { DropdownMenuBody } from "./DropdownMenuBody";
import {
  buildDropdownButtonClasses,
  buildDropdownMenuClasses,
  buildInlineDropdownClasses,
  DROPDOWN_MENU_CHROME_PX,
  DROPDOWN_OPTION_ROW_HEIGHT_PX,
  DROPDOWN_SEARCH_HEADER_ESTIMATE_PX,
  MAX_VISIBLE_OPTIONS_CAP,
} from "./dropdownStyles";
import { DropdownTrigger } from "./DropdownTrigger";
import { useDropdownPortalPlacement } from "./hooks/useDropdownPortalPlacement";
import { useDropdownState } from "./hooks/useDropdownState";
import { useDropdownWrapMeasurement } from "./hooks/useDropdownWrapMeasurement";

export type { DropdownOption } from "./Dropdown.types";
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
  /** Omit trigger border (e.g. nested in a popover). Errors still show a destructive rim. */
  noBorder?: boolean;
  /**
   * When true, the options list renders in a document body portal with fixed positioning so it is not
   * clipped by scrollable ancestors (e.g. search header Popovers with overflow-y-auto).
   */
  menuInPortal?: boolean;
  /**
   * When the menu is portaled, register its root element so ancestor overlays (e.g. Popover outside-click)
   * still treat clicks on the menu as inside.
   */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  /**
   * Where the menu opens relative to the trigger. `"above"` is useful near the bottom of modals/viewports.
   * @default "below"
   */
  menuPlacement?: "below" | "above" | "overlap";
  /**
   * When true, the visible label above the trigger is omitted (parent supplies layout). `label` is still
   * used for an accessible name on the trigger when set.
   */
  hideLabel?: boolean;
  /**
   * Stacking context for the portaled menu. Use `"modal"` when the trigger is inside a dialog (`z-modal`)
   * so the list renders above the modal surface (`z-modal-popover`).
   * @default "page"
   */
  menuPortalStack?: "page" | "modal";
  /**
   * How many option rows stay visible before the list scrolls (cap is approximate by row height).
   * @default 5
   */
  maxVisibleOptions?: number;
};

function Dropdown<T = unknown>({
  options,
  value,
  onChange,
  placeholder,
  label,
  required: _required,
  error,
  disabled,
  searchable = false,
  clearable = false,
  variant = "default",
  size = "md",
  className = "",
  dropdownClassName = "",
  onClear,
  noBorder = false,
  menuInPortal = false,
  registerOutsideClickSafeTarget,
  menuPlacement = "below",
  hideLabel = false,
  menuPortalStack = "page",
  maxVisibleOptions = 5,
}: DropdownProps<T>) {
  const { t } = useLocalization();
  const clampedVisibleOptions = Math.max(
    1,
    Math.min(MAX_VISIBLE_OPTIONS_CAP, Math.floor(maxVisibleOptions)),
  );
  const optionsListMaxHeightPx =
    clampedVisibleOptions * DROPDOWN_OPTION_ROW_HEIGHT_PX;
  const desiredMenuHeightPx =
    (searchable ? DROPDOWN_SEARCH_HEADER_ESTIMATE_PX : 0) +
    optionsListMaxHeightPx +
    DROPDOWN_MENU_CHROME_PX;
  const [isOpen, setIsOpen] = useState(false);
  const triggerLabelRef = useRef<HTMLSpanElement>(null);

  const doc = getDocument();
  const canPortalMenu = Boolean(menuInPortal && doc?.body);

  const dropdownState = useDropdownState({
    isOpen,
    setIsOpen,
    searchable,
    disabled,
    canPortalMenu,
  });

  const {
    searchTerm,
    setSearchTerm,
    dropdownRef,
    menuPortalRef,
    searchInputRef,
    handleToggle,
    handleSearchChange,
  } = dropdownState;

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder ?? t("form.select_option");

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const { measureRef, setOptionMeasureRef } = useDropdownWrapMeasurement(
    displayLabel,
    isOpen,
    filteredOptions,
  );

  const buttonClasses = buildDropdownButtonClasses(
    getSharedInputTextStyles,
    variant,
    size,
    noBorder,
    error,
    disabled,
    className,
  );

  const { menuSurfaceClasses, portalMenuClasses } = buildDropdownMenuClasses(
    dropdownClassName,
    menuPortalStack,
  );

  const inlineDropdownClasses = buildInlineDropdownClasses(
    menuPlacement,
    menuSurfaceClasses,
  );

  const portalPlacement = useDropdownPortalPlacement({
    isOpen,
    canPortalMenu,
    dropdownRef,
    menuPortalRef,
    menuPlacement,
    desiredMenuHeightPx,
    filteredOptionsLength: filteredOptions.length,
    registerOutsideClickSafeTarget,
  });

  const handleOptionSelect = (option: DropdownOption<T>) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange(undefined as T);
    }
  };

  const triggerA11yLabel =
    hideLabel && label ? `${label}, ${displayLabel}` : undefined;

  return (
    <Box className="w-full">
      {label && !hideLabel ? (
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </Label>
      ) : null}

      <Box className="relative" ref={dropdownRef}>
        <DropdownTrigger
          buttonClasses={buttonClasses}
          disabled={disabled}
          handleToggle={handleToggle}
          triggerA11yLabel={triggerA11yLabel}
          displayLabel={displayLabel}
          selectedOption={selectedOption}
          measureRef={measureRef}
          triggerLabelRef={triggerLabelRef}
          clearable={clearable}
          handleClear={handleClear}
          isOpen={isOpen}
          t={t}
        />

        {isOpen && !canPortalMenu && (
          <Box
            className={inlineDropdownClasses}
            style={{ maxHeight: desiredMenuHeightPx }}
          >
            <DropdownMenuBody
              searchable={searchable}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              filteredOptions={filteredOptions}
              value={value}
              setOptionMeasureRef={setOptionMeasureRef}
              handleOptionSelect={handleOptionSelect}
              t={t}
            />
          </Box>
        )}
      </Box>

      {isOpen && canPortalMenu && portalPlacement ? (
        <Portal>
          <Box
            ref={menuPortalRef}
            className={portalMenuClasses}
            style={{
              position: "fixed",
              top: portalPlacement.top,
              left: portalPlacement.left,
              width: portalPlacement.width,
              maxHeight: portalPlacement.maxHeight,
              ...(portalPlacement.transform
                ? { transform: portalPlacement.transform }
                : {}),
            }}
          >
            <DropdownMenuBody
              searchable={searchable}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              filteredOptions={filteredOptions}
              value={value}
              setOptionMeasureRef={setOptionMeasureRef}
              handleOptionSelect={handleOptionSelect}
              t={t}
            />
          </Box>
        </Portal>
      ) : null}

      {error && (
        <BodyText size="xs" className="mt-1 text-red-600">
          {error}
        </BodyText>
      )}
    </Box>
  );
}
export default Dropdown;
