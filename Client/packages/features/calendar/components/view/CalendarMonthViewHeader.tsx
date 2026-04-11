import type React from "react";

import { color, spacing } from "packages/design-tokens";
import IconButton from "packages/ui/components/button/IconButton";
import { Box, Text } from "packages/ui/components/primitives";

export type CalendarMonthViewHeaderProps = {
  /** Optional section title (e.g. "Calendar") shown above the month row */
  sectionTitle?: string;
  /** Formatted month/year label (e.g. "March 2026") */
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  /** Disable previous navigation (e.g. when at earliest allowed range) */
  disabledPrev?: boolean;
  /** Disable next navigation */
  disabledNext?: boolean;
  /** Renders the weekday row and grid inside the bordered calendar container */
  children?: React.ReactNode;
};

export function CalendarMonthViewHeader({
  sectionTitle,
  monthLabel,
  onPrev,
  onNext,
  disabledPrev = false,
  disabledNext = false,
  children,
}: CalendarMonthViewHeaderProps) {
  return (
    <Box style={styles.wrapper}>
      <Box style={styles.headerRow}>
        {sectionTitle ? (
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        ) : null}
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <IconButton
          iconName="chevron-left"
          variant="toolbar"
          size="md"
          rounded="lg"
          label="Previous month"
          onPress={onPrev}
          disabled={disabledPrev}
          className="text-text-primary"
        />
        <IconButton
          iconName="chevron-right"
          variant="toolbar"
          size="md"
          rounded="lg"
          label="Next month"
          onPress={onNext}
          disabled={disabledNext}
          className="text-text-primary"
        />
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
    flexWrap: "nowrap" as const,
    alignItems: "center" as const,
    justifyContent: "flex-start" as const,
    gap: spacing(2),
    paddingTop: spacing(3),
    paddingLeft: spacing(3),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: color("neutral.700"),
    margin: 0,
    padding: 0,
  },
  monthLabel: {
    fontSize: 20,
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
