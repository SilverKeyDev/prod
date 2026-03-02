import React from "react";

import { Check } from "lucide-react";

type OliveCheckboxProps = {
  checked: boolean;
  onToggle?: () => void;
};

/**
 * Square checkbox matching site style: olive background when checked
 * with lucide Check icon. Clickable on the square itself.
 */
const OliveCheckbox: React.FC<OliveCheckboxProps> = ({ checked, onToggle }) => {
  return (
    <div
      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${onToggle ? "cursor-pointer" : ""} ${checked ? "border-olive bg-olive" : "border-beige"}`}
      {...(onToggle ? { onClick: onToggle } : {})}
    >
      {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
    </div>
  );
};

export default OliveCheckbox;
