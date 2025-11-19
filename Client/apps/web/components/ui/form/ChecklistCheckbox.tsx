import { Check } from "lucide-react";
import React from "react";

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
}) => {
  return (
    <div className={checkboxContainerClass}>
      <input
        id={`item-${item.id}`}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onToggle}
        aria-label={item.label}
      />
      {/* visible square checkbox */}
      <div
        className={`flex h-5 w-5 lg:h-6 lg:w-6 cursor-pointer items-center justify-center rounded border transition-colors flex-shrink-0 mt-0.5 ${checked ? "border-olive bg-olive" : "border-beige"}`}
        onClick={onToggle}
      >
        {checked && (
          <Check
            className="h-[14px] w-[14px] lg:h-[16px] lg:w-[16px] text-white"
            strokeWidth={4}
          />
        )}
      </div>
      <div className="flex-1">
        <label htmlFor={`item-${item.id}`} className={itemLabelClass}>
          {item.label}
        </label>
        {!checked && (
          <div>
            <p className={itemExplanationClass}>{item.explanation}</p>
            {item.bullets && (
              <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-navy/70">
                {item.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            {item.resource && (
              <p className="mt-2 text-sm text-olive">
                {item.resource.href ? (
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
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistCheckbox;
