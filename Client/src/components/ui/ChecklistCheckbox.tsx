import React from "react";
import { Check } from "lucide-react";

interface ResourceLink {
  label: string;
  href?: string;
}

export interface ChecklistItem {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
}

interface ChecklistCheckboxProps {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  itemLabelClass: string;
  itemExplanationClass: string;
  checkboxContainerClass: string;
}

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
        className="sr-only peer"
        checked={checked}
        onChange={onToggle}
        aria-label={item.label}
      />
      {/* visible square checkbox */}
      <div
        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${checked ? 'bg-olive border-olive' : 'border-beige'}`}
        onClick={onToggle}
      >
        {checked && <Check className="h-[14px] w-[14px] text-white" strokeWidth={4} />}
      </div>
      <label htmlFor={`item-${item.id}`} className="flex-1">
        <span className={itemLabelClass}>{item.label}</span>
        {!checked && (
          <div>
            <p className={itemExplanationClass}>{item.explanation}</p>
            {item.bullets && (
              <ul className="list-disc list-inside text-navy/70 ml-4 mt-2 space-y-1">
                {item.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            {item.resource && (
              <p className="text-olive text-sm mt-2">
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
