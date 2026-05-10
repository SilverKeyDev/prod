import { color, spacing } from "packages/design-tokens";
import { useFeedGestureTrap } from "packages/hooks/ui";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

export type CalendarTimeGridDayHeaderProps = {
  date: Date;
  isToday: boolean;
  weekendStyle: Record<string, string> | null;
  /** When false, omit right divider (last day column). */
  showColumnDividerRight?: boolean;
  /**
   * When true, omit cell chrome so a parent column can own borders/background (week header stack).
   */
  chromeless?: boolean;
  onPress?: (d: Date) => void;
  onDoubleTap?: (d: Date) => void;
};

export function CalendarTimeGridDayHeader({
  date,
  isToday,
  weekendStyle,
  showColumnDividerRight = true,
  chromeless = false,
  onPress,
  onDoubleTap,
}: CalendarTimeGridDayHeaderProps) {
  const { onTap } = useFeedGestureTrap({
    onSingleTap: onPress ? () => onPress(date) : undefined,
    onDoubleTap: onDoubleTap ? () => onDoubleTap(date) : () => {},
  });

  const abbr = date.toLocaleDateString("en-US", { weekday: "short" });
  const num = date.getDate();

  const divider = chromeless || !showColumnDividerRight ? 0 : 1;

  const cellBackground = chromeless
    ? ("transparent" as const)
    : isToday
      ? color("olive.muted")
      : (weekendStyle?.backgroundColor ?? color("neutral.100"));

  return (
    <Pressable
      onPress={onTap}
      style={{
        width: "100%",
        minWidth: spacing(0),
        borderRightWidth: divider,
        borderRightColor: color("neutral.200"),
        paddingHorizontal: spacing(1),
        paddingVertical: spacing(2),
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        ...(!chromeless ? weekendStyle : null),
        backgroundColor: cellBackground,
      }}
    >
      <Text
        as="span"
        style={{
          fontSize: 11,
          fontWeight: isToday ? "800" : "700",
          color: isToday ? color("brand.accent") : color("neutral.500"),
          textAlign: "center",
        }}
      >
        {abbr}
      </Text>
      <Box
        style={{
          marginTop: spacing(1),
          minWidth: spacing(8),
          minHeight: spacing(8),
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          as="span"
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: isToday ? color("brand.accent") : color("neutral.900"),
            textAlign: "center",
          }}
        >
          {num}
        </Text>
      </Box>
    </Pressable>
  );
}
