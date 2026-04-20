import type React from "react";

import { color, spacing } from "packages/design-tokens";
import IconButton from "packages/ui/components/button/IconButton";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import type { CalendarViewType } from "@/features/calendar/types/calendar";

const VIEW_MODES: CalendarViewType[] = ["week", "month"];

function viewModeLabel(mode: CalendarViewType): string {
  switch (mode) {
    case "week":
      return "Week";
    case "month":
    default:
      return "Month";
  }
}

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
}: CalendarToolbarProps) {
  return (
    <Box style={styles.wrapper}>
      <Box style={styles.headerRow}>
        <Box style={styles.leftCluster}>
          {sectionTitle ? <Text style={styles.sectionTitle}>{sectionTitle}</Text> : null}
          <Text style={styles.monthLabel}>{toolbarLabel}</Text>
        </Box>

        <Box style={styles.rightCluster}>
          <IconButton
            iconName="chevron-left"
            variant="outline"
            size="md"
            rounded="lg"
            label="Previous"
            onPress={onPrev}
            disabled={disabledPrev}
            className="text-neutral-800"
          />
          <IconButton
            iconName="chevron-right"
            variant="outline"
            size="md"
            rounded="lg"
            label="Next"
            onPress={onNext}
            disabled={disabledNext}
            className="text-neutral-800"
          />
          <Box style={styles.segmentedTrack}>
            {VIEW_MODES.map((mode, idx) => {
              const selected = mode === viewMode;
              const isLast = idx === VIEW_MODES.length - 1;
              return (
                <Pressable
                  key={mode}
                  onPress={() => onViewModeChange(mode)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  label={`${viewModeLabel(mode)} view`}
                  style={[
                    styles.segment,
                    !isLast ? styles.segmentWithDivider : null,
                    selected ? styles.segmentSelected : null,
                  ]}
                >
                  <Text
                    style={[styles.segmentLabel, selected ? styles.segmentLabelSelected : null]}
                  >
                    {viewModeLabel(mode)}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
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
  segmentedTrack: {
    display: "flex" as const,
    flexDirection: "row" as const,
    alignItems: "stretch" as const,
    marginLeft: spacing(1),
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.100"),
    overflow: "hidden" as const,
  },
  segment: {
    flex: 1,
    minWidth: 56,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "transparent",
  },
  segmentWithDivider: {
    borderRightWidth: 1,
    borderRightColor: color("neutral.200"),
  },
  segmentSelected: {
    backgroundColor: color("brand.accent"),
    borderRightColor: color("brand.accent"),
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: color("neutral.700"),
  },
  segmentLabelSelected: {
    color: color("neutral.50"),
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
