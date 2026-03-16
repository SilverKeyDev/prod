import React from "react";

import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { Box } from "packages/ui/components/primitives";
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

import AccessibleCheckboxInput from "./AccessibleCheckboxInput";
type ResourceLink = {
  label: string;
  href?: string;
};
export type ChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
};
type ChecklistCheckboxProps = {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  itemLabelClass: string;
  itemExplanationClass: string;
  checkboxContainerClass: string;
  number?: number;
  /** When true, checkbox is disabled and shows locked state. */
  disabled?: boolean;
};
/**
 * Reusable styled checkbox row for checklist pages.
 * Keeps consistent styling across Closing & Moving In, Inspections & Inspections, etc.
 */
const ChecklistCheckbox: React.FC<ChecklistCheckboxProps> = ({
  item,
  checked,
  onToggle,
  itemLabelClass,
  itemExplanationClass,
  checkboxContainerClass,
  number,
  disabled = false,
}) => {
  const ariaLabel = number != null ? `${number}. ${item.label}` : item.label;
  const handleToggle = () => {
    if (!disabled) onToggle();
  };
  return (
    <Box className={checkboxContainerClass}>
      <AccessibleCheckboxInput
        id={`item-${item.id}`}
        className="peer sr-only"
        checked={checked}
        onChange={handleToggle}
        label={ariaLabel}
        disabled={disabled}
      />
      {/* visible square checkbox */}
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 flex-row items-center justify-center rounded border ${HOVER_BG_CLASSES} lg:h-6 lg:w-6 ${disabled ? "cursor-not-allowed border-gray-200 bg-gray-100" : checked ? "border-olive bg-olive cursor-pointer" : "border-border-input cursor-pointer"}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {checked && (
          <Icon name="check" className="h-3.5 w-3.5 text-white lg:h-4 lg:w-4" strokeWidth={4} />
        )}
        {!checked && disabled && <Icon name="lock" className="h-3 w-3 text-gray-400" />}
      </Box>
      <Box className="flex-1 text-left">
        <Label htmlFor={`item-${item.id}`} className={itemLabelClass}>
          {number != null ? `${number}. ` : ""}
          {item.label}
        </Label>
        {!checked && (
          <Box className="flex flex-col gap-1.5">
            <BodyText size="xs" className={itemExplanationClass}>
              {item.explanation}
            </BodyText>
            {item.bullets && (
              <ul className="ml-4 flex list-inside list-disc flex-col gap-1.5 text-left text-xs text-neutral-600">
                {item.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            {item.resource && (
              <BodyText size="xs" className="text-responsive-xs text-olive">
                {item.resource.href ? (
                  /* eslint-disable-next-line silverkey/no-primitive-components -- external link; href from resource */
                  <a
                    href={item.resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-olive hover:text-olive-light active:text-olive active:text-olive-light underline"
                  >
                    {item.resource.label}
                  </a>
                ) : (
                  item.resource.label
                )}
              </BodyText>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
export default ChecklistCheckbox;
