import React from "react";

import { Button } from "@/components/ui/index.web";

export type UnderlineTabItem = {
  id: string;
  label: React.ReactNode;
};

export type UnderlineTabsProps = {
  items: UnderlineTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** When true, uses tighter padding for mobile. */
  compact?: boolean;
  /** Optional class for the container. */
  className?: string;
};

/**
 * Standardized underline tabs: green (olive) straight underline for active tab,
 * same text color for all tabs. Uses UI Button with ghost variant.
 */
export function UnderlineTabs({
  items,
  activeId,
  onChange,
  compact = false,
  className = "",
}: UnderlineTabsProps): JSX.Element {
  const containerClass = compact
    ? "flex items-center justify-center border-b border-gray-200"
    : "flex flex-shrink-0 border-b border-gray-200";
  const buttonLayoutClass = compact
    ? "flex items-center justify-center px-responsive-sm py-responsive-sm"
    : "flex flex-1 items-center justify-center px-4 py-2";
  const textSizeClass = compact ? "text-responsive-sm" : "text-sm";

  return (
    <div
      className={className ? `${containerClass} ${className}` : containerClass}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            rounded="none"
            onClick={() => onChange(item.id)}
            className={`${buttonLayoutClass} ${textSizeClass} border-b-2 transition-colors font-medium text-neutral-600 ${
              isActive
                ? "border-olive font-semibold"
                : "border-transparent hover:text-neutral-800"
            }`}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
