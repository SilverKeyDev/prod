import type React from "react";

import { color, spacing } from "packages/design-tokens";
import IconButton from "packages/ui/components/button/IconButton";
import { Box, Text } from "packages/ui/components/primitives";

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
      <Box style={styles.headerRow}>
        <Box style={styles.leftCluster}>
          {sectionTitle ? <Text style={styles.sectionTitle}>{sectionTitle}</Text> : null}
          <Text style={styles.toolbarDateRange}>{toolbarLabel}</Text>
        </Box>

        <Box style={styles.rightCluster}>
          <IconButton
            iconName="chevron-left"
            variant="outline"
            size="md"
            rounded="lg"
            label={prevLabel}
            onPress={onPrev}
            disabled={disabledPrev}
            className={TRAVERSE_ICON_BUTTON_CLASSNAME}
          />
          <IconButton
            iconName="chevron-right"
            variant="outline"
            size="md"
            rounded="lg"
            label={nextLabel}
            onPress={onNext}
            disabled={disabledNext}
            className={TRAVERSE_ICON_BUTTON_CLASSNAME}
          />
          {showViewModeToggle ? (
            <CalendarViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          ) : null}
        </Box>
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
  headerRow: {
    display: "flex" as const,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: spacing(2),
    paddingTop: spacing(3),
    paddingHorizontal: spacing(3),
  },
  leftCluster: {
    display: "flex" as const,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    gap: spacing(2),
    minWidth: 0,
    flex: 1,
  },
  rightCluster: {
    display: "flex" as const,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    gap: spacing(2),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: color("neutral.700"),
    margin: 0,
    padding: 0,
  },
  /** Primary toolbar label: visible date range. */
  toolbarDateRange: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: color("neutral.900"),
    letterSpacing: -0.5,
    margin: 0,
    padding: 0,
    marginLeft: spacing(2),
  },
  calendarWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    overflow: "hidden" as const,
    backgroundColor: color("neutral.50"),
  },
};
