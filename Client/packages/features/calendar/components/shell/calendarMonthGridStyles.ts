import { color, spacing } from "packages/design-tokens";

type SpacingFn = (n: number) => string | number;

export function buildCalendarMonthGridStyles(spacingFn: SpacingFn) {
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
      minWidth: 0,
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
    weekRow: {
      display: "flex" as const,
      flexDirection: "row" as const,
      width: "100%" as const,
      alignItems: "stretch" as const,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 8,
      paddingHorizontal: 4,
      position: "relative" as const,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center" as const,
    },
    cellLastInRow: {
      borderRightWidth: 0,
    },
    cellMuted: { opacity: 0.45 },
    /** Selected day in month grid — very light gold (not green/gray). */
    cellSelected: {
      backgroundColor: hexToRgbaToken(color("gold.DEFAULT"), 0.22),
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: color("neutral.800"),
    },
    /** Day number text inside the “today” green circle. */
    dayNumberOnTodayCircle: {
      color: color("neutral.50"),
    },
    dayNumberCircle: {
      minWidth: spacingFn(7),
      minHeight: spacingFn(7),
      paddingHorizontal: spacingFn(1.5),
      borderRadius: 9999,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: color("brand.accent"),
    },
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
      paddingVertical: 4,
      paddingHorizontal: spacing(2),
      borderRadius: 6,
      alignSelf: "flex-start" as const,
      display: "flex" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    eventChipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      flexShrink: 0,
    },
    /** Multi-day / range event — first (or only) day shown in a cell */
    eventChipMultiDay: {
      borderWidth: 1,
      borderStyle: "dashed" as const,
      borderColor: color("neutral.400"),
    },
    /** Same event on later days of a range */
    eventChipMultiDayContinuation: {
      borderWidth: 1,
      borderStyle: "dashed" as const,
      borderColor: color("neutral.400"),
      backgroundColor: "rgba(120, 120, 120, 0.08)",
    },
    eventChipText: {
      fontSize: 10,
      fontWeight: "600" as const,
      color: color("neutral.800"),
      textAlign: "left" as const,
      flex: 1,
      minWidth: 0,
    },
  };
}

/** Parse design-token hex `color("path")` for alpha blend (token returns hex). */
function hexToRgbaToken(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) {
    return `rgba(163, 177, 138, ${alpha})`;
  }
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export type CalendarMonthGridStyles = ReturnType<typeof buildCalendarMonthGridStyles>;
