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
  optional?: boolean;
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
  const hasExplanation = Boolean(item.explanation?.trim());
  const hasBullets = Boolean(item.bullets && item.bullets.length > 0);
  const hasTip = Boolean(item.tip?.trim());
  const showDetailsBlock =
    showDetails &&
    (hasExplanation || hasBullets || Boolean(item.resource) || hasTip);
  return (
    <Box className={checkboxContainerClass}>
      <AccessibleCheckboxInput
        id={`item-${item.id}`}
        className="peer sr-only focus:outline-none focus:ring-0"
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
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 flex-row items-center justify-center rounded border ${HOVER_BG_CLASSES} lg:h-6 lg:w-6 ${
          disabled
            ? "border-border bg-disabled cursor-not-allowed"
            : checked
              ? "border-primary bg-primary cursor-pointer"
              : "border-border-input cursor-pointer"
        }`}
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
          <Icon
            name="check"
            className="h-3.5 w-3.5 text-white lg:h-4 lg:w-4"
            strokeWidth={4}
          />
        )}
        {!checked && disabled && (
          <Icon name="lock" className="text-text-secondary h-3 w-3" />
        )}
      </Box>
      <Box className="flex-1 text-left">
        <Label htmlFor={`item-${item.id}`} className={itemLabelClass}>
          {number != null ? `${number}. ` : ""}
          {item.label}
          {item.optional ? (
            <BodyText
              as="span"
              size="xs"
              className="text-warm-stone font-normal"
            >
              {" "}
              (optional)
            </BodyText>
          ) : null}
        </Label>
        {showDetailsBlock ? (
          <Box className="flex flex-col gap-1.5">
            {hasExplanation ? (
              <BodyText size="xs" className={itemExplanationClass}>
                {item.explanation}
              </BodyText>
            ) : null}
            {hasBullets ? (
              <Box className="mt-1 flex flex-col gap-1.5">
                {item.bullets!.map((bullet, idx) => (
                  <Box key={idx} className="flex flex-row items-start gap-2">
                    <BodyText size="xs" className="text-text-secondary">
                      •
                    </BodyText>
                    <BodyText size="xs" className="text-text-secondary flex-1">
                      {bullet}
                    </BodyText>
                  </Box>
                ))}
              </Box>
            ) : null}
            {item.resource ? (
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
            ) : null}
            {hasTip ? (
              <BodyText size="xs" className="text-primary-700 mt-1 font-medium">
                {item.tip}
              </BodyText>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
export default ChecklistCheckbox;
