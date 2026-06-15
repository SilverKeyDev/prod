import React, { useId, useMemo, useState } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { useLocalization } from "packages/contexts";
import { Portal } from "packages/ui/components/structure/portal";
import { Box } from "packages/ui/components/structure/primitives";
import { usePopoverContext } from "packages/ui/components/surfaces/popover/PopoverContext";
import { getDocument } from "packages/utils/core/platform";
import { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

import type { DropdownOption } from "./Dropdown.types";
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
import type { MultiSelectDropdownProps } from "./MultiSelectDropdown.types";
import { MultiSelectDropdownMenuBody } from "./MultiSelectDropdownMenuBody";

export type { MultiSelectDropdownProps } from "./MultiSelectDropdown.types";

function buildMultiSelectDisplayLabel<T>(
  options: DropdownOption<T>[],
  value: T[],
  placeholder: string,
  allSelectedLabel?: string
): string {
  if (value.length === 0) {
    return placeholder;
  }
  if (value.length === options.length && options.length > 0) {
    return allSelectedLabel ?? options.map((o) => o.label).join(", ");
  }
  const selectedLabels = options
    .filter((o) => value.some((v) => v === o.value))
    .map((o) => o.label);
  if (selectedLabels.length <= 2) {
    return selectedLabels.join(", ");
  }
  return `${selectedLabels.length} types`;
}

function MultiSelectDropdown<T = unknown>({
  options,
  value,
  onChange,
  placeholder = "Types",
  allSelectedLabel = "All types",
  label,
  required: _required,
  error,
  disabled,
  searchable = false,
  variant = "default",
  size = "md",
  className = "",
  dropdownClassName = "",
  noBorder = false,
  menuInPortal = true,
  registerOutsideClickSafeTarget,
  menuPlacement = "below",
  hideLabel = false,
  menuPortalStack,
  maxVisibleOptions = 5,
}: MultiSelectDropdownProps<T>) {
  const { t } = useLocalization();
  const menuListId = useId();
  const popoverCtx = usePopoverContext();
  const effectiveSafeTarget =
    registerOutsideClickSafeTarget ?? popoverCtx?.registerOutsideClickSafeTarget;
  const effectivePortalStack = menuPortalStack ?? popoverCtx?.panelStack ?? "page";
  const clampedVisibleOptions = Math.max(
    1,
    Math.min(MAX_VISIBLE_OPTIONS_CAP, Math.floor(maxVisibleOptions))
  );
  const optionsListMaxHeightPx = clampedVisibleOptions * DROPDOWN_OPTION_ROW_HEIGHT_PX;
  const desiredMenuHeightPx =
    (searchable ? DROPDOWN_SEARCH_HEADER_ESTIMATE_PX : 0) +
    optionsListMaxHeightPx +
    DROPDOWN_MENU_CHROME_PX;
  const [isOpen, setIsOpen] = useState(false);
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
    dropdownRef,
    menuPortalRef,
    searchInputRef,
    handleToggle,
    handleSearchChange,
  } = dropdownState;

  const displayLabel = useMemo(
    () => buildMultiSelectDisplayLabel(options, value, placeholder, allSelectedLabel),
    [options, value, placeholder, allSelectedLabel]
  );

  const hasSelection = value.length > 0;

  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const { measureRef, setOptionMeasureRef } = useDropdownWrapMeasurement(
    displayLabel,
    isOpen,
    filteredOptions
  );

  const buttonClasses = buildDropdownButtonClasses(
    getSharedInputTextStyles,
    variant,
    size,
    noBorder,
    error,
    disabled,
    className
  );

  const { menuSurfaceClasses, portalMenuClasses } = buildDropdownMenuClasses(
    dropdownClassName,
    effectivePortalStack
  );

  const inlineDropdownClasses = buildInlineDropdownClasses(menuPlacement, menuSurfaceClasses);

  const portalPlacement = useDropdownPortalPlacement({
    isOpen,
    canPortalMenu,
    dropdownRef,
    menuPortalRef,
    menuPlacement,
    desiredMenuHeightPx,
    filteredOptionsLength: filteredOptions.length,
    registerOutsideClickSafeTarget: effectiveSafeTarget,
  });

  const handleOptionToggle = (option: DropdownOption<T>) => {
    if (option.disabled) {
      return;
    }
    const isSelected = value.some((v) => v === option.value);
    if (isSelected) {
      onChange(value.filter((v) => v !== option.value));
    } else {
      onChange([...value, option.value]);
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange([]);
  };

  const triggerA11yLabel = hideLabel && label ? `${label}, ${displayLabel}` : undefined;

  return (
    <Box className="w-full">
      {label && !hideLabel ? (
        <Label className="mb-2 block text-sm font-medium text-gray-700">{label}</Label>
      ) : null}

      <Box className="relative" ref={dropdownRef}>
        <DropdownTrigger
          menuListId={menuListId}
          buttonClasses={buttonClasses}
          disabled={disabled}
          handleToggle={handleToggle}
          triggerA11yLabel={triggerA11yLabel}
          displayLabel={displayLabel}
          selectedOption={hasSelection ? { value: value[0] as T, label: displayLabel } : undefined}
          measureRef={measureRef}
          clearable={false}
          handleClear={handleClear}
          isOpen={isOpen}
          t={t}
        />

        {isOpen && !canPortalMenu && (
          <Box className={inlineDropdownClasses} style={{ maxHeight: desiredMenuHeightPx }}>
            <MultiSelectDropdownMenuBody
              menuListId={menuListId}
              menuAriaLabel={label}
              searchable={searchable}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              filteredOptions={filteredOptions}
              value={value}
              setOptionMeasureRef={setOptionMeasureRef}
              handleOptionToggle={handleOptionToggle}
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
              ...(portalPlacement.transform ? { transform: portalPlacement.transform } : {}),
            }}
          >
            <MultiSelectDropdownMenuBody
              menuListId={menuListId}
              menuAriaLabel={label}
              searchable={searchable}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              filteredOptions={filteredOptions}
              value={value}
              setOptionMeasureRef={setOptionMeasureRef}
              handleOptionToggle={handleOptionToggle}
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

export default MultiSelectDropdown;
