import { color, spacing } from "packages/design-tokens";

const MAX_ASPECT_RATIO = 1.5;

type SpacingFn = (n: number) => string | number;

export function buildCalendarMonthGridStyles(cellWidth: `${number}%`, spacingFn: SpacingFn) {
  return {
    container: {
      width: "100%" as const,
      gap: 0,
      flexDirection: "column" as const,
    },
    weekHeader: {
      display: "flex" as const,
      flexDirection: "row" as const,
      width: "100%" as const,
      flexShrink: 0,
    },
    weekHeaderCell: {
      display: "flex" as const,
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      backgroundColor: color("neutral.50"),
    },
    weekHeaderText: {
      textAlign: "center" as const,
      fontSize: 12,
      fontWeight: "700" as const,
      color: color("neutral.500"),
    },
    grid: {
      display: "flex" as const,
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
    },
    cell: {
      width: cellWidth,
      paddingVertical: 10,
      paddingHorizontal: 4,
      position: "relative" as const,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      minHeight: 44,
      maxHeight: 200,
      aspectRatio: MAX_ASPECT_RATIO,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center" as const,
    },
    cellMuted: { opacity: 0.45 },
    cellSelected: { backgroundColor: "rgba(163, 177, 138, 0.18)" },
    dayNumber: {
      position: "absolute" as const,
      top: spacingFn(1.5),
      left: spacingFn(1.5),
      fontSize: 14,
      fontWeight: "700" as const,
      color: color("neutral.800"),
    },
    dayNumberSelected: { color: color("brand.accent") },
    cellContent: {
      marginTop: 26,
      width: "100%" as const,
      minWidth: 0,
      flex: 1,
      alignSelf: "stretch" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "flex-start" as const,
      justifyContent: "flex-start" as const,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color("brand.accent"),
    },
    eventChip: {
      width: "90%" as const,
      maxWidth: "90%" as const,
      minWidth: 0,
      marginTop: 4,
      marginLeft: spacing(2),
      paddingVertical: 2,
      paddingLeft: spacing(2),
      paddingRight: 4,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: color("brand.accent"),
      backgroundColor: "rgba(163, 177, 138, 0.12)",
      alignSelf: "flex-start" as const,
    },
    eventChipText: {
      fontSize: 10,
      fontWeight: "600" as const,
      color: color("neutral.800"),
      textAlign: "left" as const,
    },
  };
}

export type CalendarMonthGridStyles = ReturnType<typeof buildCalendarMonthGridStyles>;
