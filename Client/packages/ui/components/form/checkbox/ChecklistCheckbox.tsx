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
  /** When false, hides explanation, bullets, and resource. Default true for backward compatibility. */
  showDetails?: boolean;
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
  showDetails = true,
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
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 flex-row items-center justify-center rounded border ${HOVER_BG_CLASSES} lg:h-6 lg:w-6 ${disabled ? "border-border bg-disabled cursor-not-allowed" : checked ? "border-primary bg-primary cursor-pointer" : "border-border-input cursor-pointer"}`}
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
        {!checked && disabled && <Icon name="lock" className="text-text-secondary h-3 w-3" />}
      </Box>
      <Box className="flex-1 text-left">
        <Label htmlFor={`item-${item.id}`} className={itemLabelClass}>
          {number != null ? `${number}. ` : ""}
          {item.label}
        </Label>
        {showDetails && (
          <Box className="flex flex-col gap-1.5">
            <BodyText size="xs" className={itemExplanationClass}>
              {item.explanation}
            </BodyText>
            {item.bullets && (
              <ul className="text-text-secondary ml-4 flex list-inside list-disc flex-col gap-1.5 text-left text-xs">
                {item.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            {item.resource && (
              <BodyText size="xs" className="text-responsive-xs text-primary">
                {item.resource.href ? (
                  /* eslint-disable-next-line silverkey/no-primitive-components -- external link; href from resource */
                  <a
                    href={item.resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover active:text-primary underline"
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
