import React, { useMemo } from "react";

import { FlatList, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";
import { dateParseISO } from "packages/utils/date";

import { EventCard } from "./EventCard";

type EventListProps = {
  events: ExtendedGoogleEvent[];
  title?: string;
  emptyMessage?: string;
  onEventClick?: (event: ExtendedGoogleEvent) => void;
  /** When true, render with View+map instead of FlatList so it can sit inside another VirtualizedList (e.g. list header). */
  embedInListHeader?: boolean;
};

export function EventList({
  events,
  title = "Upcoming Events",
  emptyMessage = "No upcoming events",
  onEventClick,
  embedInListHeader = false,
}: EventListProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      try {
        const dateA = dateParseISO(a.start.dateTime).valueOf();
        const dateB = dateParseISO(b.start.dateTime).valueOf();
        return dateA - dateB;
      } catch {
        return 0;
      }
    });
  }, [events]);

  return (
    <Box style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {sortedEvents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : embedInListHeader ? (
        <View style={styles.list}>
          {sortedEvents.map((event, index) => (
            <React.Fragment key={String(event.id ?? `event-${index}`)}>
              {index > 0 ? <View style={styles.sep} /> : null}
              <EventCard event={event} onClick={() => onEventClick?.(event)} />
            </React.Fragment>
          ))}
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(e, i) => String(e.id ?? `event-${i}`)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <EventCard event={item} onClick={() => onEventClick?.(item)} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.200"),
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: color("neutral.900"),
    marginBottom: 12,
  },
  empty: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: color("neutral.500"),
  },
  list: {
    paddingBottom: 8,
  },
  sep: {
    height: 10,
  },
});
