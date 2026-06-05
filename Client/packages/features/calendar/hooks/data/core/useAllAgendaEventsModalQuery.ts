import { useCallback, useMemo } from "react";

import { dateNow } from "packages/utils/core/date";

import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import { mergeUpcomingAgendaItems } from "@/features/calendar/utils/agenda/mergeUpcomingAgenda";
import { filterAgendaEventsAllTime } from "@/features/calendar/utils/parsing/eventFiltering";

import { useClientCalendarEventsQuery } from "./useClientCalendarEventsQuery";

export type UseAllAgendaEventsModalQueryParams = {
  modalOpen: boolean;
  isConnected: boolean;
  silverKeyCalendarId: string | null;
  agendaTodos: AgendaTodoDTO[] | undefined;
  /** Agent hub: load this client's calendar for the wide-range modal. */
  clientUserId?: string | null;
};

export function useAllAgendaEventsModalQuery({
  modalOpen,
  isConnected,
  silverKeyCalendarId,
  agendaTodos,
  clientUserId = null,
}: UseAllAgendaEventsModalQueryParams) {
  const isClientMode = Boolean(clientUserId);

  const range = useMemo(() => {
    const start = dateNow().subtract(5, "year").startOf("day");
    const end = dateNow().add(2, "year").endOf("day");
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, []);

  const clientIdForQuery = isClientMode && modalOpen ? clientUserId : null;

  const clientModalQuery = useClientCalendarEventsQuery(
    clientIdForQuery,
    range.timeMin,
    range.timeMax,
    "primary"
  );

  const queryEnabledSelf = modalOpen && isConnected && !isClientMode;

  const {
    events: selfEvents,
    refreshEvents: refreshSelfEvents,
    eventsLoading: selfLoading,
  } = useGoogleEvents({
    calendarId: "primary",
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    enabled: queryEnabledSelf,
  });

  const eventsForFilter = useMemo(() => {
    if (isClientMode) {
      return (clientModalQuery.data ?? []).map((e) => ({
        ...e,
        calendarId: "primary" as const,
      }));
    }
    return selfEvents;
  }, [isClientMode, clientModalQuery.data, selfEvents]);

  const refreshAllAgendaEvents = useCallback(async () => {
    if (isClientMode) {
      // refetch runs only when callers invoke refreshAllAgendaEvents (modal UI), not from an effect in this hook.
      await clientModalQuery.refetch();
      return;
    }
    await refreshSelfEvents();
  }, [isClientMode, clientModalQuery, refreshSelfEvents]);

  const effectiveSilverKey = isClientMode ? null : silverKeyCalendarId;

  const filteredEvents = useMemo(
    () => filterAgendaEventsAllTime(eventsForFilter, effectiveSilverKey),
    [eventsForFilter, effectiveSilverKey]
  );

  const items = useMemo(
    () => mergeUpcomingAgendaItems(filteredEvents, agendaTodos !== undefined ? agendaTodos : []),
    [agendaTodos, filteredEvents]
  );

  const allAgendaEventsLoading = isClientMode
    ? modalOpen && clientModalQuery.isLoading
    : selfLoading;

  const allAgendaEventsQueryEnabled = isClientMode ? modalOpen : queryEnabledSelf;

  return {
    allAgendaModalItems: items,
    refreshAllAgendaEvents,
    allAgendaEventsLoading,
    allAgendaEventsQueryEnabled,
  };
}
