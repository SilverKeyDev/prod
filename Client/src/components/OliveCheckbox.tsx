import React from "react";
import { Check } from "lucide-react";

interface OliveCheckboxProps {
  checked: boolean;
  onToggle?: () => void;
}

/**
 * Square checkbox matching site style: olive background when checked
 * with lucide Check icon. Clickable on the square itself.
 */
const OliveCheckbox: React.FC<OliveCheckboxProps> = ({ checked, onToggle }) => {
  return (
    <div
      className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${onToggle ? 'cursor-pointer' : ''} ${checked ? "bg-olive border-olive" : "border-beige"}`}
      {...(onToggle ? { onClick: onToggle } : {})}
    >
      {checked && (
        <Check className="h-[14px] w-[14px] text-white" strokeWidth={4} />
      )}
    </div>
  );
};

export default OliveCheckbox;
