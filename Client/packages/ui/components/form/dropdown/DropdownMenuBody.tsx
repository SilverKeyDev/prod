import React from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { Box } from "packages/ui/components/primitives";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

import type { DropdownOption } from "./Dropdown.types";

export type DropdownMenuBodyProps<T> = {
  searchable: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredOptions: DropdownOption<T>[];
  value?: T;
  setOptionMeasureRef: (index: number) => (el: HTMLSpanElement | null) => void;
  handleOptionSelect: (option: DropdownOption<T>) => void;
  t: (key: string) => string;
};

export function DropdownMenuBody<T>({
  searchable,
  searchInputRef,
  searchTerm,
  handleSearchChange,
  filteredOptions,
  value,
  setOptionMeasureRef,
  handleOptionSelect,
  t,
}: DropdownMenuBodyProps<T>): React.ReactElement {
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
              placeholder={t("form.search_options")}
              className={`focus:border-input-variant-focus-border placeholder:text-text-secondary w-full rounded border border-neutral-200 py-2 pl-9 pr-3 transition-all duration-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 ${(
                getSharedInputTextStyles as () => string
              )()}`}
            />
          </Box>
        </Box>
      ) : null}

      <Box className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
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
              className={`touch-friendly flex w-full items-center justify-between gap-2 px-4 py-4 text-left outline-none transition-colors duration-150 ${(
                getSharedInputTextStyles as () => string
              )()} ${
                option.disabled
                  ? "text-text-disabled cursor-not-allowed"
                  : "text-text-secondary hover:text-text-primary cursor-pointer hover:bg-neutral-50"
              } ${
                option.value === value ? "bg-primary-muted text-text-primary font-medium" : ""
              } ${option.menuRowClassName ?? ""} ${
                index > 0 ? "border-t border-neutral-200" : ""
              } hover:font-normal focus:bg-neutral-50 active:bg-neutral-100`}
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
                  className="relative z-10 flex items-center text-xs sm:text-sm md:text-base"
                >
                  {option.icon}
                  {option.label}
                </BodyText>
              </Box>
              {option.value === value && <Icon name="check" className="text-primary h-4 w-4" />}
            </Button>
          ))
        )}
      </Box>
    </Box>
  );
}
