import React from "react";

import { Icon } from "@ui/icons";

import { Box, Row } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

import { Button } from "@/components/ui";

export type UnderlineTabItem = {
  id: string;
  label: React.ReactNode;
  /** Optional icon shown before the label. */
  icon?: React.ReactNode;
  /** When true, tab shows lock icon and muted styling (view-only, still clickable). */
  locked?: boolean;
};

export type UnderlineTabsProps = {
  items: UnderlineTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** When true, uses tighter padding for mobile. */
  compact?: boolean;
  /** Optional class for the container. */
  className?: string;
  /** Underline color class (default: bg-accent-underline). */
  underlineColor?: string;
};

/**
 * Standardized underline tabs: gold straight underline for active tab by default,
 * optional icon support, same text color for all tabs. Uses UI Button with ghost variant.
 */
export function UnderlineTabs({
  items,
  activeId,
  onChange,
  compact = false,
  className = "",
  underlineColor = "bg-accent-underline",
}: UnderlineTabsProps): JSX.Element {
  const containerClass = compact
    ? "flex flex-row items-center justify-center rounded-none border-b border-gray-200"
    : "flex flex-row flex-shrink-0 rounded-none border-b border-gray-200";
  const buttonLayoutClass = compact
    ? "relative flex flex-row items-center justify-center px-responsive-sm py-responsive-xs"
    : "relative flex flex-row flex-1 items-center justify-center px-responsive-md py-responsive-sm";
  const textSizeClass = compact ? "text-responsive-sm" : "text-responsive-sm";

  return (
    // eslint-disable-next-line silverkey/no-dynamic-class-names -- conditional containerClass/className; refactor complex
    <Row className={className ? `${containerClass} ${className}` : containerClass}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const isLocked = item.locked === true;
        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            rounded="none"
            onClick={() => onChange(item.id)}
            // eslint-disable-next-line silverkey/no-dynamic-class-names -- conditional buttonLayoutClass/isLocked/isActive; refactor complex
            className={`${buttonLayoutClass} ${textSizeClass} font-medium ${HOVER_BG_CLASSES} focus:outline-none focus:ring-0 ${isLocked ? "text-neutral-400 opacity-75 hover:text-neutral-500 active:text-neutral-600 active:opacity-90" : isActive ? "font-semibold text-neutral-600" : "text-neutral-600 hover:text-neutral-800 active:text-neutral-900 active:opacity-90"} active:text-neutral-500 active:text-neutral-800`}
          >
            <Box className="flex flex-row items-center justify-center gap-2">
              {isLocked ? (
                <Icon name="lock" className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                item.icon != null && <Box className="shrink-0">{item.icon}</Box>
              )}
              {item.label}
            </Box>
            {isActive && (
              <BodyText
                as="span"
                // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                className={`${underlineColor} absolute bottom-0 left-0 right-0 h-0.5 rounded-none`}
                aria-hidden
              />
            )}
          </Button>
        );
      })}
    </Row>
  );
}
