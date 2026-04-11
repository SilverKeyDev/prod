import { useMemo } from "react";

import { dateNow } from "packages/utils/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import type { Calendar } from "@/features/calendar/types/calendar";
import {
  filterAgendaEventsAllTime,
  filterEventsByCalendars,
} from "@/features/calendar/utils/eventFiltering";
import { mergeUpcomingAgendaItems } from "@/features/calendar/utils/mergeUpcomingAgenda";

import { useGoogleEvents } from "./useGoogleEvents";

export type UseAllAgendaEventsModalQueryParams = {
  calendarIds: string[];
  enabledCalendarIds: Set<string>;
  calendars: Calendar[];
  modalOpen: boolean;
  isConnected: boolean;
  calendarsConfigured: boolean;
  silverKeyCalendarId: string | null;
  agendaTodos: AgendaTodoDTO[] | undefined;
};

export function useAllAgendaEventsModalQuery({
  calendarIds,
  enabledCalendarIds,
  calendars,
  modalOpen,
  isConnected,
  calendarsConfigured,
  silverKeyCalendarId,
  agendaTodos,
}: UseAllAgendaEventsModalQueryParams) {
  const range = useMemo(() => {
    const start = dateNow().subtract(5, "year").startOf("day");
    const end = dateNow().add(2, "year").endOf("day");
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, []);

  const queryEnabled =
    modalOpen &&
    isConnected &&
    calendarsConfigured &&
    calendarIds.length > 0;

  const { events, refreshEvents, eventsLoading } = useGoogleEvents({
    calendarIds,
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    enabled: queryEnabled,
  });

  const filteredEvents = useMemo(
    () =>
      filterAgendaEventsAllTime(
        filterEventsByCalendars(events, enabledCalendarIds, calendars),
        silverKeyCalendarId,
      ),
    [calendars, enabledCalendarIds, events, silverKeyCalendarId],
  );

  const items = useMemo(
    () =>
      mergeUpcomingAgendaItems(
        filteredEvents,
        agendaTodos !== undefined ? agendaTodos : [],
      ),
    [agendaTodos, filteredEvents],
  );

  return {
    allAgendaModalItems: items,
    refreshAllAgendaEvents: refreshEvents,
    allAgendaEventsLoading: eventsLoading,
    allAgendaEventsQueryEnabled: queryEnabled,
  };
}
