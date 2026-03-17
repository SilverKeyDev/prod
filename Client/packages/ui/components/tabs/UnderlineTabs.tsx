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
  /** Underline color class (default: bg-gold, matching search Results/Saved). */
  underlineColor?: string;
  /** When "sidebar", uses white text and white underline for sidebar-gray backgrounds. */
  variant?: "default" | "sidebar";
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
  underlineColor = "bg-gold",
  variant = "default",
}: UnderlineTabsProps): JSX.Element {
  const isSidebar = variant === "sidebar";
  const containerClass = compact
    ? `flex flex-row items-center justify-center rounded-none border-b ${isSidebar ? "border-white/20" : "border-border"}`
    : `flex flex-row flex-shrink-0 rounded-none border-b ${isSidebar ? "border-white/20" : "border-border"}`;
  const buttonLayoutClass = compact
    ? "relative flex flex-row items-center justify-center px-responsive-sm py-responsive-xs"
    : "relative flex flex-row flex-1 items-center justify-center px-responsive-md py-responsive-sm";

  return (
    <Row className={className ? `${containerClass} ${className}` : containerClass}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const isLocked = item.locked === true;
        const textSizeClass = isActive ? "text-responsive-md" : "text-responsive-sm";
        const iconSizeClass = isActive ? "h-5 w-5" : "h-4 w-4";
        const fontWeightClass = isActive ? "font-bold" : "font-medium";
        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            rounded="none"
            onClick={() => onChange(item.id)}
            className={`${buttonLayoutClass} ${textSizeClass} ${fontWeightClass} ${HOVER_BG_CLASSES} focus:outline-none focus:ring-0 ${
              isSidebar
                ? isLocked
                  ? "text-white/50 opacity-75 hover:text-white/70 active:opacity-90"
                  : isActive
                    ? "text-white"
                    : "text-white/80 hover:text-white active:text-white"
                : isLocked
                  ? "text-neutral-400 opacity-75 hover:text-neutral-500 active:text-neutral-600 active:opacity-90"
                  : isActive
                    ? "text-neutral-600"
                    : "text-neutral-600 hover:text-neutral-800 active:text-neutral-900 active:opacity-90"
            } ${isSidebar ? "" : "active:text-neutral-500 active:text-neutral-800"}`}
          >
            <Box className="flex flex-row items-center justify-center gap-2">
              {isLocked ? (
                <Icon name="lock" className={`${iconSizeClass} shrink-0`} aria-hidden />
              ) : (
                item.icon != null && <Box className={`${iconSizeClass} shrink-0`}>{item.icon}</Box>
              )}
              {item.label}
            </Box>
            {isActive && (
              <BodyText
                as="span"
                className={`${isSidebar ? "bg-white" : underlineColor} absolute bottom-0 left-2 right-2 h-0.5 rounded-none`}
                aria-hidden
              />
            )}
          </Button>
        );
      })}
    </Row>
  );
}
