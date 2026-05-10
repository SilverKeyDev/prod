import { color, spacing } from "packages/design-tokens";
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

export type CalendarViewModeToggleProps = {
  viewMode: CalendarViewType;
  onViewModeChange: (mode: CalendarViewType) => void;
};

/**
 * Week / Month segmented control — same visuals as the main calendar toolbar.
 */
export function CalendarViewModeToggle({
  viewMode,
  onViewModeChange,
}: CalendarViewModeToggleProps) {
  return (
    <Box
      style={toggleStyles.segmentedTrack}
      accessibilityRole="tablist"
      // Tablist group name — Box has no unified `label` prop in primitives.
      // eslint-disable-next-line silverkey/no-direct-accessibility-props -- tablist container
      accessibilityLabel="Calendar view"
    >
      {VIEW_MODES.map((mode) => {
        const selected = mode === viewMode;
        return (
          <Pressable
            key={mode}
            onPress={() => onViewModeChange(mode)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            label={`${viewModeLabel(mode)} calendar`}
            style={[toggleStyles.segment, selected ? toggleStyles.segmentSelected : null]}
          >
            <Text
              style={[
                toggleStyles.segmentLabel,
                selected ? toggleStyles.segmentLabelSelected : toggleStyles.segmentLabelMuted,
              ]}
            >
              {viewModeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}

const toggleStyles = {
  segmentedTrack: {
    display: "flex" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexShrink: 0,
    gap: spacing(1),
    padding: spacing(0.5),
    /** Match `IconButton` size `md`: Tailwind `min-h-9` (36px) inclusive of border. */
    height: spacing(9),
    minHeight: spacing(9),
    maxHeight: spacing(9),
    boxSizing: "border-box" as const,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.100"),
  },
  segment: {
    flex: 1,
    minWidth: 72,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  segmentSelected: {
    backgroundColor: color("background-surface"),
    borderWidth: 1,
    borderColor: color("gold.DEFAULT"),
    shadowColor: color("neutral.900"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  segmentLabelSelected: {
    color: color("neutral.900"),
  },
  segmentLabelMuted: {
    color: color("neutral.600"),
    fontWeight: "500" as const,
  },
};
