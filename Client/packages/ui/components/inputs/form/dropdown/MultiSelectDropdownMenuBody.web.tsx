import React from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { Box } from "packages/ui/components/structure/primitives";
import { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

import type { DropdownOption } from "./Dropdown.types";
import { DROPDOWN_OPTION_ROW_BASE_CLASSES } from "./dropdownStyles";

function isOptionSelected<T>(value: T[], optionValue: T): boolean {
  return value.some((v) => v === optionValue);
}

export type MultiSelectDropdownMenuBodyProps<T> = {
  menuListId: string;
  menuAriaLabel?: string;
  searchable: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredOptions: DropdownOption<T>[];
  value: T[];
  setOptionMeasureRef: (index: number) => (el: HTMLSpanElement | null) => void;
  handleOptionToggle: (option: DropdownOption<T>) => void;
  t: (key: string) => string;
};

export function MultiSelectDropdownMenuBody<T>({
  menuListId,
  menuAriaLabel,
  searchable,
  searchInputRef,
  searchTerm,
  handleSearchChange,
  filteredOptions,
  value,
  setOptionMeasureRef,
  handleOptionToggle,
  t,
}: MultiSelectDropdownMenuBodyProps<T>): React.ReactElement {
  const sharedInputText = getSharedInputTextStyles();
  const searchPlaceholder = t("form.search_options");

  return (
    <Box className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {searchable ? (
        <Box className="shrink-0 border-b border-neutral-200 p-2">
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
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className={`focus:border-input-variant-focus-border placeholder:text-text-secondary w-full rounded border border-neutral-200 py-2 pl-9 pr-3 transition-all duration-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 ${sharedInputText}`}
            />
          </Box>
        </Box>
      ) : null}

      <Box
        id={menuListId}
        role="listbox"
        aria-multiselectable={true}
        {...(menuAriaLabel != null && menuAriaLabel !== "" ? { "aria-label": menuAriaLabel } : {})}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        {filteredOptions.length === 0 ? (
          <Box className="text-text-secondary px-3 py-2 text-sm">
            {searchable ? t("form.no_options_found") : t("form.no_options_available")}
          </Box>
        ) : (
          filteredOptions.map((option, index) => {
            const selected = isOptionSelected(value, option.value);
            return (
              <Button
                key={index}
                type="button"
                variant="ghost"
                role="option"
                aria-selected={selected}
                onClick={() => handleOptionToggle(option)}
                disabled={option.disabled}
                className={`${DROPDOWN_OPTION_ROW_BASE_CLASSES} ${sharedInputText} ${
                  option.disabled
                    ? "text-text-disabled cursor-not-allowed"
                    : selected
                      ? "text-text-primary cursor-pointer bg-neutral-100 font-medium hover:bg-neutral-100"
                      : "text-text-secondary hover:text-text-primary cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                } ${option.menuRowClassName ?? ""} ${
                  index > 0 ? "border-t border-neutral-200" : ""
                }`}
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
                    className="z-header relative flex min-w-0 items-center gap-2 text-xs sm:text-sm md:text-base"
                  >
                    {option.icon}
                    {option.label}
                  </BodyText>
                </Box>
                {selected ? <Icon name="check" className="text-primary h-4 w-4" /> : null}
              </Button>
            );
          })
        )}
      </Box>
    </Box>
  );
}
