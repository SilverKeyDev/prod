import type React from "react";

import { color, spacing } from "packages/design-tokens";
import { IconButton } from "packages/ui";
import { Box, Text } from "packages/ui/components/structure/primitives";

import type { CalendarViewType } from "@/features/calendar/types/calendar";

import { CalendarViewModeToggle } from "./CalendarViewModeToggle";

/** Outline IconButtons default to primary fill on hover — keep a static surface for prev/next. */
const TRAVERSE_ICON_BUTTON_CLASSNAME =
  "text-neutral-800 hover:!bg-background-surface hover:!text-neutral-800 active:!bg-background-surface active:!text-neutral-800 disabled:hover:!bg-background-surface";

export type CalendarToolbarProps = {
  sectionTitle?: string;
  toolbarLabel: string;
  viewMode: CalendarViewType;
  onViewModeChange: (mode: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  disabledPrev?: boolean;
  disabledNext?: boolean;
  children?: React.ReactNode;
  /** When false, hides the Week/Month segmented control (e.g. week-only embedded pickers). @default true */
  showViewModeToggle?: boolean;
};

export function CalendarToolbar({
  sectionTitle,
  toolbarLabel,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  disabledPrev = false,
  disabledNext = false,
  children,
  showViewModeToggle = true,
}: CalendarToolbarProps) {
  const prevLabel = viewMode === "week" ? "Previous week" : "Previous month";
  const nextLabel = viewMode === "week" ? "Next week" : "Next month";

  return (
    <Box style={styles.wrapper}>
      {/*
       * Mobile: prev | centered date range | next on one row; toggle below.
       * sm+: date range + prev/next on the left; Week|Month toggle on the right.
       * Padding uses CSS-compatible keys so web `Box` (div) applies insets (RN shorthands do not).
       */}
      <Box
        style={styles.headerSection}
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <Box className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          {sectionTitle ? (
            <Text style={styles.sectionTitle} className="shrink-0">
              {sectionTitle}
            </Text>
          ) : null}
          <Box className="flex min-w-0 w-full flex-row items-center gap-2 sm:w-auto">
            <IconButton
              iconName="chevron-left"
              variant="outline"
              size="md"
              rounded="lg"
              label={prevLabel}
              onPress={onPrev}
              disabled={disabledPrev}
              className={`${TRAVERSE_ICON_BUTTON_CLASSNAME} order-1 shrink-0 sm:order-2`}
            />
            <Text
              style={styles.toolbarDateRange}
              numberOfLines={1}
              className="order-2 min-w-0 flex-1 truncate text-center text-base sm:order-1 sm:flex-none sm:text-left sm:text-xl"
            >
              {toolbarLabel}
            </Text>
            <IconButton
              iconName="chevron-right"
              variant="outline"
              size="md"
              rounded="lg"
              label={nextLabel}
              onPress={onNext}
              disabled={disabledNext}
              className={`${TRAVERSE_ICON_BUTTON_CLASSNAME} order-3 shrink-0`}
            />
          </Box>
        </Box>

        {showViewModeToggle ? (
          <Box className="flex w-full shrink-0 flex-row items-center justify-end sm:w-auto">
            <CalendarViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </Box>
        ) : null}
      </Box>

      {children ? <Box style={styles.calendarWrapper}>{children}</Box> : null}
    </Box>
  );
}

const styles = {
  wrapper: {
    width: "100%" as const,
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: spacing(3),
  },
  /**
   * Only static (non-layout) properties live here. Flex direction and alignment
   * are controlled via Tailwind className so responsive breakpoints work correctly
   * (inline styles would override Tailwind's responsive classes).
   */
  /** Inset nav + toggle + date range from the card edges (works on web and native). */
  headerSection: {
    paddingTop: spacing(3),
    paddingLeft: spacing(3),
    paddingRight: spacing(3),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: color("neutral.700"),
    margin: 0,
    padding: 0,
  },
  /**
   * Primary toolbar label: visible date range.
   * fontSize is intentionally omitted — responsive sizing is applied via
   * Tailwind className (text-base on mobile, sm:text-xl on larger screens).
   */
  toolbarDateRange: {
    fontWeight: "800" as const,
    color: color("neutral.900"),
    letterSpacing: -0.5,
    margin: 0,
    padding: 0,
  },
  calendarWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    overflow: "hidden" as const,
    backgroundColor: color("neutral.50"),
  },
};
