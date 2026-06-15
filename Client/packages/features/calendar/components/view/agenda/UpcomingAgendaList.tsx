import React, { type ReactNode } from "react";

import { color } from "packages/design-tokens";
import type { UpdateTodoRequest } from "packages/features/agent/api/agent";
import { SCROLL_PANEL_MAX, ScrollPanel } from "packages/ui/components/structure/layout/ScrollPanel";
import { Box, Text } from "packages/ui/components/structure/primitives";
import type { CardBorderVariant } from "packages/ui/components/surfaces/cards/Card";
import Card from "packages/ui/components/surfaces/cards/Card";

import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import {
  AGENDA_TODAY_EMPTY_MESSAGE,
  type UpcomingAgendaItem,
} from "@/features/calendar/utils/agenda/mergeUpcomingAgenda";

import { EventCard } from "./EventCard";
import { TodoAgendaRow } from "./TodoAgendaRow";

type UpcomingAgendaListProps = {
  items: UpcomingAgendaItem[];
  title?: string;
  emptyMessage?: string;
  headerActions?: ReactNode;
  embedInListHeader?: boolean;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onEventClick?: (event: ExtendedGoogleEvent) => void;
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
  updateAgendaTodo?: (id: string, data: UpdateTodoRequest) => Promise<void>;
  deleteAgendaTodo?: (id: string) => Promise<void>;
  onSigningAgendaPress?: (agreementId: string) => void;
  border?: CardBorderVariant;
  isAgendaEventComplete?: (event: ExtendedGoogleEvent) => boolean;
  onToggleAgendaEventComplete?: (event: ExtendedGoogleEvent) => void;
};

const titleStyle = {
  fontSize: 18,
  fontWeight: "800" as const,
  color: color("neutral.900"),
  textAlign: "left" as const,
};

const emptyStyle = {
  paddingVertical: 12,
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

function agendaItemKey(item: UpcomingAgendaItem, index: number) {
  if (item.kind === "event") {
    return String(item.event.id ?? `event-${index}`);
  }
  return `todo-${item.todo.id}`;
}

function renderRow(
  item: UpcomingAgendaItem,
  props: Omit<
    UpcomingAgendaListProps,
    "items" | "title" | "emptyMessage" | "headerActions" | "border"
  >
) {
  if (item.kind === "event") {
    const canToggleAgenda =
      Boolean(props.onToggleAgendaEventComplete) && Boolean(props.isAgendaEventComplete);
    return (
      <EventCard
        event={item.event}
        silverKeyCalendarId={props.silverKeyCalendarId ?? null}
        refreshEvents={props.refreshEvents}
        updateEvent={props.updateEvent}
        deleteEvent={props.deleteEvent}
        calendars={props.calendars ?? []}
        onClick={() => props.onEventClick?.(item.event)}
        agendaComplete={props.isAgendaEventComplete?.(item.event) ?? false}
        onToggleAgendaComplete={
          props.onToggleAgendaEventComplete
            ? () => props.onToggleAgendaEventComplete?.(item.event)
            : undefined
        }
        canToggleAgendaComplete={canToggleAgenda}
      />
    );
  }

  return (
    <TodoAgendaRow
      todo={item.todo}
      onToggleComplete={(id) => props.onToggleAgendaTodo?.(id)}
      canEditComplete={Boolean(props.canEditAgendaTodos && props.onToggleAgendaTodo)}
      updateTodo={props.updateAgendaTodo}
      deleteTodo={props.deleteAgendaTodo}
      onSigningPress={props.onSigningAgendaPress}
    />
  );
}

export function UpcomingAgendaList({
  items,
  title = "Upcoming",
  emptyMessage = AGENDA_TODAY_EMPTY_MESSAGE,
  headerActions,
  embedInListHeader: _embedInListHeader = false,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onEventClick,
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
  updateAgendaTodo,
  deleteAgendaTodo,
  onSigningAgendaPress,
  border = "charcoal",
  isAgendaEventComplete,
  onToggleAgendaEventComplete,
}: UpcomingAgendaListProps) {
  const rowProps = {
    silverKeyCalendarId,
    refreshEvents,
    updateEvent,
    deleteEvent,
    calendars,
    onEventClick,
    onToggleAgendaTodo,
    canEditAgendaTodos,
    updateAgendaTodo,
    deleteAgendaTodo,
    onSigningAgendaPress,
    isAgendaEventComplete,
    onToggleAgendaEventComplete,
  };

  const listBody =
    items.length === 0 ? (
      <Box style={emptyStyle}>
        <Text style={emptyTextStyle}>{emptyMessage}</Text>
      </Box>
    ) : (
      <Box style={listStyle}>
        {items.map((item, index) => (
          <React.Fragment key={agendaItemKey(item, index)}>
            {index > 0 ? <Box style={sepStyle} /> : null}
            {renderRow(item, rowProps)}
          </React.Fragment>
        ))}
      </Box>
    );

  const listContent = <ScrollPanel maxHeight={SCROLL_PANEL_MAX.agenda}>{listBody}</ScrollPanel>;

  return (
    <Card border={border} className="w-full text-left" padding="md" hover={false}>
      {title || headerActions ? (
        <Box className="mb-3 flex flex-row flex-wrap items-center gap-2">
          {title ? (
            <Text style={{ ...titleStyle, flex: 1 }}>{title}</Text>
          ) : (
            <Box className="flex-1" />
          )}
          {headerActions ? <Box className="flex-shrink-0">{headerActions}</Box> : null}
        </Box>
      ) : null}
      {listContent}
    </Card>
  );
}
