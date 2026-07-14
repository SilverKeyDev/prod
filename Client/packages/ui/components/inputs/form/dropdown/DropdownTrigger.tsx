import { type MouseEvent, type ReactElement, type RefObject, useRef } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { Box, Row } from "packages/ui/components/structure/primitives";

import type { DropdownOption } from "./Dropdown.types";
import { DROPDOWN_TRIGGER_INNER_FOCUS_RESET } from "./dropdownStyles";

export type DropdownTriggerProps<T> = {
  menuListId: string;
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
  menuListId,
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
  const showClear = clearable && Boolean(selectedOption) && !disabled;
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const focusTriggerButton = () => {
    triggerButtonRef.current?.focus();
  };

  const handleChevronMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    focusTriggerButton();
  };

  const handleChevronClick = () => {
    if (disabled) return;
    focusTriggerButton();
    handleToggle();
  };

  return (
    <Row className={`${buttonClasses} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <Button
        ref={triggerButtonRef}
        type="button"
        variant="ghost"
        contentAlign="start"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={triggerA11yLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuListId : undefined}
        aria-haspopup="listbox"
        className={`h-auto min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none hover:bg-transparent ${DROPDOWN_TRIGGER_INNER_FOCUS_RESET}`}
      >
        <Box className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption?.icon ? (
            <Box className="flex shrink-0 items-center">{selectedOption.icon}</Box>
          ) : null}
          <BodyText
            as="span"
            ref={measureRef}
            className={`min-w-0 flex-1 whitespace-normal break-words text-left text-xs leading-snug sm:text-sm md:text-base ${
              selectedOption ? "text-gray-600" : "!text-gray-400"
            }`}
          >
            {displayLabel}
          </BodyText>
        </Box>
      </Button>

      {showClear ? (
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          icon={<Icon name="x" className="h-4 w-4" />}
          label={t("form.clear_aria")}
          disabled={disabled}
          className={`shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-gray-100 ${DROPDOWN_TRIGGER_INNER_FOCUS_RESET}`}
          tabIndex={-1}
        />
      ) : null}

      <Box
        className={`flex shrink-0 items-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onMouseDown={handleChevronMouseDown}
        onClick={handleChevronClick}
        aria-hidden
      >
        <Icon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 transform" : ""
          }`}
        />
      </Box>
    </Row>
  );
}
