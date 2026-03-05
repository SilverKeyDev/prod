import React from "react";

import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

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
}) => {
  const ariaLabel = number != null ? `${number}. ${item.label}` : item.label;
  return (
    <div className={checkboxContainerClass}>
      <AccessibleCheckboxInput
        id={`item-${item.id}`}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onToggle}
        label={ariaLabel}
      />
      {/* visible square checkbox */}
      <div
        role="button"
        tabIndex={0}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border transition-colors lg:h-6 lg:w-6 ${checked ? "border-olive bg-olive" : "border-beige"}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {checked && (
          <Icon name="check" className="h-3.5 w-3.5 text-white lg:h-4 lg:w-4" strokeWidth={4} />
        )}
      </div>
      <div className="flex-1">
        <Label htmlFor={`item-${item.id}`} className={itemLabelClass}>
          {number != null ? `${number}. ` : ""}
          {item.label}
        </Label>
        {!checked && (
          <div>
            <BodyText size="xs" className={itemExplanationClass}>
              {item.explanation}
            </BodyText>
            {item.bullets && (
              <ul className="text-navy/70 ml-4 mt-2 list-inside list-disc space-y-1 text-xs">
                {item.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            {item.resource && (
              <BodyText size="xs" className="text-responsive-xs text-olive mt-2">
                {item.resource.href ? (
                  /* eslint-disable-next-line silverkey/no-primitive-components -- external link; href from resource */
                  <a
                    href={item.resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-olive hover:text-olive-light underline"
                  >
                    {item.resource.label}
                  </a>
                ) : (
                  item.resource.label
                )}
              </BodyText>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChecklistCheckbox;
