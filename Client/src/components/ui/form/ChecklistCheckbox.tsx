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
 * Keeps consistent styling across Closing & Moving In, Inspections & Due Diligence, etc.
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
        className={`flex h-4 w-4 lg:h-5 lg:w-5 cursor-pointer items-center justify-center rounded border transition-colors ${checked ? "border-olive bg-olive" : "border-beige"}`}
        onClick={onToggle}
      >
        {checked && (
          <Check
            className="h-[12px] w-[12px] lg:h-[14px] lg:w-[14px] text-white"
            strokeWidth={4}
          />
        )}
      </div>
      <label htmlFor={`item-${item.id}`} className="flex-1">
        <span className={itemLabelClass}>{item.label}</span>
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
                    className="underline hover:text-olive/80"
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
      </label>
    </div>
  );
};

export default ChecklistCheckbox;
