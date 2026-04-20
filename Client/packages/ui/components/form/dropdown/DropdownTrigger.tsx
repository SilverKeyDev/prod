import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import type { MouseEvent, ReactElement, RefObject } from "react";

import { Box } from "packages/ui/components/primitives";

import type { DropdownOption } from "./Dropdown.types";

export type DropdownTriggerProps<T> = {
  buttonClasses: string;
  disabled?: boolean;
  handleToggle: () => void;
  triggerA11yLabel?: string;
  displayLabel: string;
  selectedOption: DropdownOption<T> | undefined;
  measureRef: RefObject<HTMLSpanElement | null>;
  clearable: boolean;
  handleClear: (e: MouseEvent<HTMLButtonElement>) => void;
  isOpen: boolean;
  t: (key: string) => string;
};

export function DropdownTrigger<T>({
  buttonClasses,
  disabled,
  handleToggle,
  triggerA11yLabel,
  displayLabel,
  selectedOption,
  measureRef,
  clearable,
  handleClear,
  isOpen,
  t,
}: DropdownTriggerProps<T>): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      contentAlign="start"
      onClick={handleToggle}
      disabled={disabled}
      aria-label={triggerA11yLabel}
      className={`${buttonClasses} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <Box className="flex w-full min-w-0 flex-row items-center justify-between gap-2">
        <BodyText
          as="span"
          ref={measureRef}
          className={`min-w-0 flex-1 whitespace-normal break-words text-left text-xs leading-snug sm:text-sm md:text-base ${
            selectedOption ? "text-gray-600" : "!text-gray-400"
          }`}
        >
          {displayLabel}
        </BodyText>

        <Box className="flex shrink-0 items-center justify-end gap-1">
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
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180 transform" : ""
            }`}
          />
        </Box>
      </Box>
    </Button>
  );
}
