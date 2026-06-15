import React, { type ReactNode, useMemo } from "react";

import { color, spacing } from "packages/design-tokens";
import { SCROLL_PANEL_MAX, ScrollPanel } from "packages/ui/components/structure/layout/ScrollPanel";
import { Box, Text } from "packages/ui/components/structure/primitives";
import type { CardBorderVariant } from "packages/ui/components/surfaces/cards/Card";
import Card from "packages/ui/components/surfaces/cards/Card";
import { dateParseISO } from "packages/utils/core/date";

import type { Calendar } from "@/features/calendar/types/calendar";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

import { EventCard } from "./EventCard";

type EventListProps = {
  events: ExtendedGoogleEvent[];
  title?: string;
  /** Secondary line under title (e.g. full date when title is "Today's schedule"). */
  subtitle?: string;
  emptyMessage?: string;
  /** Shown below the list when non-empty (e.g. "No other events today"). */
  footerHint?: string;
  headerActions?: ReactNode;
  onEventClick?: (event: ExtendedGoogleEvent) => void;
  /** When true, render list only (no ScrollView) for embedding in another scroll/list. */
  embedInListHeader?: boolean;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  /** Card border variant. Default charcoal; use "light" for upcoming-events style. */
  border?: CardBorderVariant;
  /** Tighter padding and header spacing for embedded calendar day panel. */
  density?: "default" | "compact";
};

const titleStyle = {
  fontSize: 18,
  fontWeight: "800" as const,
  color: color("neutral.900"),
  textAlign: "left" as const,
};

const subtitleStyle = {
  fontSize: 13,
  fontWeight: "500" as const,
  color: color("neutral.500"),
  textAlign: "left" as const,
};

const footerHintStyle = {
  fontSize: 13,
  color: color("neutral.500"),
  textAlign: "left" as const,
  marginTop: 10,
};

const emptyStyle = {
  paddingVertical: 8,
  alignItems: "flex-start" as const,
};

const emptyStyleCompact = {
  paddingVertical: 6,
  alignItems: "flex-start" as const,
};

const emptyTextStyle = {
  fontSize: 14,
  color: color("neutral.500"),
  textAlign: "left" as const,
};

const listStyle = {
  paddingBottom: 8,
  alignSelf: "stretch" as const,
  alignItems: "flex-start" as const,
};

const sepStyle = {
  height: 10,
};

export function EventList({
  events,
  title = "Upcoming Events",
  subtitle,
  emptyMessage = "No upcoming events",
  footerHint,
  headerActions,
  onEventClick,
  embedInListHeader: _embedInListHeader = false,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  border = "charcoal",
  density = "default",
}: EventListProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      try {
        const aStart = a.start?.dateTime ?? a.start?.date;
        const bStart = b.start?.dateTime ?? b.start?.date;
        if (!aStart || !bStart) return 0;
        return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
      } catch {
        return 0;
      }
    });
  }, [events]);

  const emptyBoxStyle = density === "compact" ? emptyStyleCompact : emptyStyle;
  const titleMarginBottom = density === "compact" ? spacing(0.5) : spacing(1);

  const listBody =
    sortedEvents.length === 0 ? (
      <Box style={emptyBoxStyle}>
        <Text style={emptyTextStyle}>{emptyMessage}</Text>
      </Box>
    ) : (
      <Box style={listStyle}>
        {sortedEvents.map((event, index) => (
          <React.Fragment key={String(event.id ?? `event-${index}`)}>
            {index > 0 ? <Box style={sepStyle} /> : null}
            <EventCard
              event={event}
              silverKeyCalendarId={silverKeyCalendarId}
              refreshEvents={refreshEvents}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
              calendars={calendars}
              onClick={() => onEventClick?.(event)}
            />
          </React.Fragment>
        ))}
      </Box>
    );

  const listContent = <ScrollPanel maxHeight={SCROLL_PANEL_MAX.agenda}>{listBody}</ScrollPanel>;

  const cardPadding = density === "compact" ? "sm" : "md";
  const headerBoxClass =
    density === "compact"
      ? "mb-2 flex flex-row flex-wrap items-center gap-2"
      : "mb-3 flex flex-row flex-wrap items-center gap-2";

  return (
    <Card border={border} className="w-full text-left" padding={cardPadding} hover={false}>
      {title || subtitle || headerActions ? (
        <Box className={headerBoxClass}>
          {title || subtitle ? (
            <Box className="min-w-0 flex-1">
              {title ? (
                <Text
                  style={{
                    ...titleStyle,
                    marginBottom: subtitle ? spacing(0.5) : titleMarginBottom,
                  }}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null}
            </Box>
          ) : (
            <Box className="flex-1" />
          )}
          {headerActions ? <Box className="flex-shrink-0">{headerActions}</Box> : null}
        </Box>
      ) : null}
      {listContent}
      {footerHint && sortedEvents.length > 0 ? (
        <Text style={footerHintStyle}>{footerHint}</Text>
      ) : null}
    </Card>
  );
}
