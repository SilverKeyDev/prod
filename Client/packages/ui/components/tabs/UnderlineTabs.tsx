import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box, Row, Text } from "packages/ui/components/primitives";
import {
  SIDEBAR_TAB_ACTIVE_TEXT,
  SIDEBAR_TAB_ACTIVE_UNDERLINE,
  SIDEBAR_TAB_INACTIVE_TEXT,
  SIDEBAR_TAB_LOCKED_TEXT,
  SIDEBAR_TAB_ROW_BORDER,
} from "packages/ui/components/sidebar/sidebarTheme";
import BodyText from "packages/ui/components/text/BodyText";
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

import { Button } from "@/components/ui";

import {
  UNDERLINE_TAB_SIZE_STYLES,
  underlineTabsButtonSize,
  type UnderlineTabsSize,
} from "./underlineTabSizeStyles";

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
  /**
   * Optional tab id for the user's current journey phase (e.g. first incomplete checklist section).
   * Renders a small inline “You are here.” pill next to that tab’s label, distinct from {@link activeId}
   * (the tab being viewed).
   */
  phaseIndicatorId?: string;
  /** When true, uses tighter padding for mobile. */
  compact?: boolean;
  /** Tab label scale; default matches previous sizing. */
  size?: UnderlineTabsSize;
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
  phaseIndicatorId,
  compact = false,
  size: tabSize = "sm",
  className = "",
  underlineColor = "bg-gold",
  variant = "default",
}: UnderlineTabsProps): JSX.Element {
  const { t } = useLocalization();
  const isSidebar = variant === "sidebar";
  const sizeStyles = UNDERLINE_TAB_SIZE_STYLES[tabSize];
  const containerClass = compact
    ? `flex flex-row items-center justify-center rounded-none ${
        isSidebar ? SIDEBAR_TAB_ROW_BORDER : "border-b border-border"
      }`
    : `flex flex-row flex-shrink-0 rounded-none ${
        isSidebar ? SIDEBAR_TAB_ROW_BORDER : "border-b border-border"
      }`;
  const paddingWithFlex = compact ? sizeStyles.paddingCompact : sizeStyles.paddingDefault;
  /** `flex-1` on every tab forces equal widths; strip it when distributing extra space to the journey tab. */
  const buttonLayoutClass = paddingWithFlex
    .replace(/\bflex-1\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <Row className={className ? `${containerClass} ${className}` : containerClass}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const isLocked = item.locked === true;
        const isJourneyPhase = phaseIndicatorId != null && phaseIndicatorId === item.id;
        const textSizeClass = isActive ? sizeStyles.activeText : sizeStyles.inactiveText;
        const iconSizeClass = isActive ? sizeStyles.activeIcon : sizeStyles.inactiveIcon;
        const fontWeightClass = isActive ? "font-bold" : "font-medium";
        const flexClass =
          phaseIndicatorId != null
            ? isJourneyPhase
              ? "min-w-0 flex-[1.55] sm:flex-[1.65]"
              : "min-w-0 flex-1"
            : "min-w-0 flex-1";
        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size={underlineTabsButtonSize(tabSize)}
            rounded="none"
            onClick={() => onChange(item.id)}
            className={`relative ${buttonLayoutClass} ${flexClass} ${textSizeClass} ${fontWeightClass} ${HOVER_BG_CLASSES} focus:outline-none focus:ring-0 ${
              isSidebar
                ? isLocked
                  ? SIDEBAR_TAB_LOCKED_TEXT
                  : isActive
                    ? SIDEBAR_TAB_ACTIVE_TEXT
                    : SIDEBAR_TAB_INACTIVE_TEXT
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
              {isJourneyPhase ? (
                <Box className="bg-gold-muted inline-flex shrink-0 flex-row items-center gap-0.5 rounded-full py-0.5 pl-1.5 pr-1.5">
                  <Box className="bg-gold h-1 w-1 shrink-0 rounded-full" aria-hidden />
                  <Text
                    as="span"
                    className="text-gold text-xs font-medium leading-none tracking-tight"
                  >
                    {t("common.you_are_here")}
                  </Text>
                </Box>
              ) : null}
            </Box>
            {isActive && (
              <BodyText
                as="span"
                className={`${
                  isSidebar ? SIDEBAR_TAB_ACTIVE_UNDERLINE : underlineColor
                } absolute bottom-0 left-2 right-2 h-0.5 rounded-none`}
                aria-hidden
              />
            )}
          </Button>
        );
      })}
    </Row>
  );
}
