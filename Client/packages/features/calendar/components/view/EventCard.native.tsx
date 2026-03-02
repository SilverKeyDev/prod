import React, { useMemo } from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import { getEventEndDate, getEventStartDate } from "@/features/calendar/utils/eventParsing";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  onClick?: () => void;
};

function formatDate(date: Date) {
  try {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

export function EventCard({ event, onClick }: EventCardProps) {
  const dateRange = useMemo(() => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);
      if (!start || !end) return "";
      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(end)}`;
      }
      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    } catch {
      return "";
    }
  }, [event]);

  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      style={[styles.card, !onClick && styles.cardNoPress]}
    >
      <View style={styles.leftAccent} />
      <Box style={styles.content}>
        <Text style={styles.summary}>{event.summary || "Untitled Event"}</Text>
        {dateRange ? <Text style={styles.meta}>{dateRange}</Text> : null}
        {event.location ? <Text style={styles.metaMuted}>{event.location}</Text> : null}
      </Box>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.200"),
    overflow: "hidden",
  },
  cardNoPress: {
    opacity: 1,
  },
  leftAccent: {
    width: 4,
    backgroundColor: color("gold.muted"),
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  summary: {
    fontSize: 15,
    fontWeight: "700",
    color: color("neutral.900"),
  },
  meta: {
    fontSize: 13,
    color: color("neutral.700"),
  },
  metaMuted: {
    fontSize: 13,
    color: color("neutral.600"),
  },
});
