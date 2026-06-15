import React, { useCallback, useRef } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import Button from "packages/ui/components/actions/button/Button";
import { Box, Row, Text } from "packages/ui/components/structure/primitives";
import {
  SIDEBAR_TAB_ACTIVE_TEXT,
  SIDEBAR_TAB_ACTIVE_UNDERLINE,
  SIDEBAR_TAB_INACTIVE_TEXT,
  SIDEBAR_TAB_LOCKED_TEXT,
  SIDEBAR_TAB_ROW_BORDER,
} from "packages/ui/components/structure/sidebar/sidebarTheme";
import { navRowTypography } from "packages/ui/styles/theme/navTabTypography";
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

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
  /** When "sidebar", uses white text and white underline for dark chrome (`background-sidebar`). */
  variant?: "default" | "sidebar";
  /**
   * When true, the tab row scrolls horizontally only if tabs cannot fit; tabs otherwise split the
   * allotted width evenly (`flex-1` / `basis-0`).
   * Ignored when {@link phaseIndicatorId} is set (journey layout keeps weighted flex).
   */
  scrollable?: boolean;
};

/**
 * Standardized underline tabs: gold straight underline for active tab by default,
 * optional icon support, same text color for all tabs. Uses UI `Button` with ghost variant.
 *
 * **Accessibility:** The outer `Row` is a tab list (`role="tablist"`). Each item uses
 * `accessibilityRole="tab"` and `accessibilityState.selected` on the shared `Button`.
 *
 * **Keyboard:** ArrowLeft/ArrowRight/Home/End move focus and selection (WAI-ARIA tabs pattern).
 * Pair with tab panels in the parent using `id` / `aria-controls` / `role="tabpanel"` when applicable.
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
  scrollable = false,
}: UnderlineTabsProps): JSX.Element {
  const { t } = useLocalization();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      onChange(item.id);
      tabRefs.current[index]?.focus();
    },
    [items, onChange]
  );

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const { key } = event;
      if (key === "ArrowLeft") {
        event.preventDefault();
        focusTab(index === 0 ? items.length - 1 : index - 1);
      } else if (key === "ArrowRight") {
        event.preventDefault();
        focusTab(index === items.length - 1 ? 0 : index + 1);
      } else if (key === "Home") {
        event.preventDefault();
        focusTab(0);
      } else if (key === "End") {
        event.preventDefault();
        focusTab(items.length - 1);
      }
    },
    [focusTab, items.length]
  );

  const isSidebar = variant === "sidebar";
  const sizeStyles = UNDERLINE_TAB_SIZE_STYLES[tabSize];
  const scrollableRow =
    scrollable && phaseIndicatorId == null
      ? "max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
      : "";
  /** Full-width row so equal `flex-1` tabs divide the allotted space; `min-w-0` allows shrinking in nested flex/grid. */
  const widthClass = "w-full min-w-0";
  const containerClass = compact
    ? `flex flex-row items-stretch rounded-none ${widthClass} ${
        isSidebar ? SIDEBAR_TAB_ROW_BORDER : "border-b border-border"
      } ${scrollableRow}`.trim()
    : `flex flex-row flex-shrink-0 flex-nowrap rounded-none ${widthClass} ${
        isSidebar ? SIDEBAR_TAB_ROW_BORDER : "border-b border-border"
      } ${scrollableRow}`.trim();
  const paddingWithFlex = compact ? sizeStyles.paddingCompact : sizeStyles.paddingDefault;
  /** `flex-1` on every tab forces equal widths; strip it when distributing extra space to the journey tab. */
  const buttonLayoutClass = paddingWithFlex
    .replace(/\bflex-1\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <Row role="tablist" className={className ? `${containerClass} ${className}` : containerClass}>
      {items.map((item, index) => {
        const isActive = activeId === item.id;
        const isLocked = item.locked === true;
        const isJourneyPhase = phaseIndicatorId != null && phaseIndicatorId === item.id;
        const iconSizeClass = isActive ? sizeStyles.activeIcon : sizeStyles.inactiveIcon;
        const rowTypo = navRowTypography[tabSize];
        const labelSlotTypography = isActive ? rowTypo.highlighted : rowTypo.inactive;
        const flexClass =
          phaseIndicatorId != null
            ? isJourneyPhase
              ? "min-w-0 flex-[1.55] basis-0 sm:flex-[1.65]"
              : "min-w-0 flex-1 basis-0"
            : "min-w-0 flex-1 basis-0";
        return (
          <Button
            key={item.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            variant="ghost"
            size={underlineTabsButtonSize(tabSize)}
            rounded="none"
            label={typeof item.label === "string" ? item.label : item.id}
            labelSlotClassName={labelSlotTypography}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            onClick={() => onChange(item.id)}
            className={`relative ${buttonLayoutClass} ${flexClass} ${HOVER_BG_CLASSES} outline-none focus:!ring-0 focus:!ring-offset-0 ${
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
            }`}
          >
            <Box
              className={`flex flex-row items-center justify-center gap-2 ${labelSlotTypography}`}
            >
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
            {isActive ? (
              <Box
                className={`${
                  isSidebar ? SIDEBAR_TAB_ACTIVE_UNDERLINE : underlineColor
                } absolute bottom-0 left-2 right-2 h-0.5 rounded-none`}
                aria-hidden
              />
            ) : null}
          </Button>
        );
      })}
    </Row>
  );
}
