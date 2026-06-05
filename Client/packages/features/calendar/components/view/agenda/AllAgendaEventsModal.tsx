import React, { useEffect, useMemo, useState } from "react";

import { Dropdown, type DropdownOption } from "packages/ui";
import { Box, Text } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";
import Cover from "packages/ui/components/surfaces/modals/cover";

import type { Calendar } from "@/features/calendar/types/calendar";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import {
  AGENDA_ALL_DISPLAY_OPTIONS,
  type AgendaAllDisplayMode,
  applyAgendaAllDisplayMode,
} from "@/features/calendar/utils/agenda/agendaAllDisplay";
import type { UpcomingAgendaItem } from "@/features/calendar/utils/agenda/mergeUpcomingAgenda";

import { EventCard } from "./EventCard";
import { TodoAgendaRow } from "./TodoAgendaRow";

const sepStyle = { height: 10 };

function agendaItemKey(item: UpcomingAgendaItem, index: number) {
  if (item.kind === "event") {
    return String(item.event.id ?? `event-${index}`);
  }
  return `todo-${item.todo.id}`;
}

type AllAgendaEventsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: UpcomingAgendaItem[];
  loading?: boolean;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
  onSigningAgendaPress?: (agreementId: string) => void;
  isAgendaEventComplete?: (event: ExtendedGoogleEvent) => boolean;
  onToggleAgendaEventComplete?: (event: ExtendedGoogleEvent) => void;
  completedEventKeys?: Record<string, true>;
};

export function AllAgendaEventsModal({
  isOpen,
  onClose,
  items,
  loading = false,
  silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
  onSigningAgendaPress,
  isAgendaEventComplete,
  onToggleAgendaEventComplete,
  completedEventKeys,
}: AllAgendaEventsModalProps) {
  const [displayMode, setDisplayMode] = useState<AgendaAllDisplayMode>("chronological");

  useEffect(() => {
    if (!isOpen) {
      setDisplayMode("chronological");
    }
  }, [isOpen]);

  const displayedItems = useMemo(
    () => applyAgendaAllDisplayMode(items, displayMode, { completedEventKeys }),
    [items, displayMode, completedEventKeys]
  );

  const sortOptions = useMemo((): DropdownOption<AgendaAllDisplayMode>[] => {
    return AGENDA_ALL_DISPLAY_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
    }));
  }, []);

  const headerContent = useMemo(
    () => (
      <Box className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Title
          as="h3"
          size="sm"
          className="text-text-primary min-w-0 shrink font-medium sm:text-lg"
        >
          All agenda items
        </Title>
        <Box className="w-full shrink-0 sm:max-w-[min(100%,280px)]">
          <Dropdown<AgendaAllDisplayMode>
            options={sortOptions}
            value={displayMode}
            onChange={setDisplayMode}
            label="Sort"
            hideLabel
            variant="compact"
            size="sm"
            menuInPortal
            menuPortalStack="modal"
            maxVisibleOptions={5}
            className="w-full"
          />
        </Box>
      </Box>
    ),
    [displayMode, sortOptions]
  );

  return (
    <Cover
      isOpen={isOpen}
      onClose={onClose}
      headerContent={headerContent}
      showCloseButton
      showHeaderBorder
      animation="slideFromRight"
    >
      {loading ? (
        <Box className="py-6">
          <Text className="text-text-secondary text-center text-sm">Loading calendar events…</Text>
        </Box>
      ) : items.length === 0 ? (
        <Box className="py-4">
          <Text className="text-text-secondary text-sm">No events or to-dos to show.</Text>
        </Box>
      ) : (
        <Box className="pb-2">
          {displayedItems.length === 0 ? (
            <Box className="py-2">
              <Text className="text-text-secondary text-sm">
                Nothing matches this view. Try a different sort in the header.
              </Text>
            </Box>
          ) : (
            displayedItems.map((item, index) => (
              <React.Fragment key={agendaItemKey(item, index)}>
                {index > 0 ? <Box style={sepStyle} /> : null}
                {item.kind === "event" ? (
                  <EventCard
                    event={item.event}
                    silverKeyCalendarId={silverKeyCalendarId}
                    refreshEvents={refreshEvents}
                    updateEvent={updateEvent}
                    deleteEvent={deleteEvent}
                    calendars={calendars}
                    agendaComplete={isAgendaEventComplete?.(item.event) ?? false}
                    onToggleAgendaComplete={
                      onToggleAgendaEventComplete
                        ? () => onToggleAgendaEventComplete(item.event)
                        : undefined
                    }
                    canToggleAgendaComplete={Boolean(
                      onToggleAgendaEventComplete && isAgendaEventComplete
                    )}
                  />
                ) : (
                  <TodoAgendaRow
                    todo={item.todo}
                    onToggleComplete={(id) => onToggleAgendaTodo?.(id)}
                    canEditComplete={Boolean(canEditAgendaTodos && onToggleAgendaTodo)}
                    onSigningPress={onSigningAgendaPress}
                  />
                )}
              </React.Fragment>
            ))
          )}
        </Box>
      )}
    </Cover>
  );
}
