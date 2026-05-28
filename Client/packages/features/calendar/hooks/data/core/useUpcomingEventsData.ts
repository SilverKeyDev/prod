import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dateNow, dayjs } from "packages/utils/date";

import { useGoogleCalendarPermissions } from "@/features/calendar/hooks/data/google/useGoogleCalendarPermissions";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import { useUpcomingAgendaHeaderActions } from "@/features/calendar/hooks/ui/useUpcomingAgendaHeaderActions";
import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import {
  filterTodosInRange,
  mergeUpcomingAgendaItems,
  sortCompletedAgendaTodosForDisplay,
} from "@/features/calendar/utils/agenda/mergeUpcomingAgenda";
import { isClientCalendarAccessError } from "@/features/calendar/utils/core/clientCalendarAccess";
import { filterUpcomingEvents } from "@/features/calendar/utils/parsing/eventFiltering";

import { useAllAgendaEventsModalQuery } from "./useAllAgendaEventsModalQuery";
import { useClientCalendarEventsQuery } from "./useClientCalendarEventsQuery";

const AGENDA_TITLE = "Agenda";

export type UseUpcomingEventsDataParams = {
  embedInListHeader?: boolean;
  suppressConnectionPrompt?: boolean;
  agendaTodos?: AgendaTodoDTO[];
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
  onSigningAgendaPress?: (agreementId: string) => void;
  headerActions?: ReactNode;
  /** When set (agent client hub), load this user's primary calendar instead of the agent's. */
  clientUserId?: string | null;
};

export function useUpcomingEventsData({
  embedInListHeader = false,
  suppressConnectionPrompt = false,
  agendaTodos,
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
  onSigningAgendaPress,
  headerActions,
  clientUserId = null,
}: UseUpcomingEventsDataParams = {}) {
  const isClientAgendaMode = Boolean(clientUserId);
  const {
    isConnected,
    connectionStatusLoading,
    calendars,
    calendarsLoading,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);

  const silverKeyCalendarId = useMemo(() => scopedCalendars[0]?.id ?? null, [scopedCalendars]);

  const { permissionsLoading, hasRequiredPermissions, isPartiallyEnabled, permissions } =
    useGoogleCalendarPermissions();

  const [allAgendaEventsModalOpen, setAllAgendaEventsModalOpen] = useState(false);

  const [todayDateString, setTodayDateString] = useState(() => dateNow().format("ddd MMM DD YYYY"));
  const lastCheckedDateRef = useRef<string>(todayDateString);

  useEffect(() => {
    const checkDate = () => {
      const currentDateString = dateNow().format("ddd MMM DD YYYY");
      if (currentDateString !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDateString;
        setTodayDateString(currentDateString);
      }
    };

    checkDate();

    const interval = setInterval(checkDate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const upcomingDateRange = useMemo(() => {
    const parsed = todayDateString ? dayjs(todayDateString, "ddd MMM DD YYYY") : null;
    const todayStart =
      parsed?.isValid() && parsed ? parsed.startOf("day") : dateNow().startOf("day");
    const nextWeek = todayStart.add(7, "day").endOf("day");
    return {
      timeMin: todayStart.toISOString(),
      timeMax: nextWeek.toISOString(),
    };
  }, [todayDateString]);

  const clientEventsQuery = useClientCalendarEventsQuery(
    isClientAgendaMode ? clientUserId : null,
    upcomingDateRange.timeMin,
    upcomingDateRange.timeMax,
    "primary"
  );

  const {
    events: selfUpcomingEventsRaw,
    refreshEvents: refreshSelfEvents,
    updateEvent: selfUpdateEvent,
    deleteEvent: selfDeleteEvent,
  } = useGoogleEvents({
    calendarId: "primary",
    timeMin: upcomingDateRange.timeMin,
    timeMax: upcomingDateRange.timeMax,
    enabled: isConnected && !isClientAgendaMode,
  });

  const upcomingEventsRaw = useMemo(() => {
    if (isClientAgendaMode) {
      return (clientEventsQuery.data ?? []).map((e) => ({
        ...e,
        calendarId: "primary" as const,
      }));
    }
    return selfUpcomingEventsRaw;
  }, [isClientAgendaMode, clientEventsQuery.data, selfUpcomingEventsRaw]);

  const refreshEvents = useCallback(async () => {
    if (isClientAgendaMode) {
      // refetch runs only when callers invoke refreshEvents (e.g. refresh control / post-mutation), not from an effect here.
      await clientEventsQuery.refetch();
      return;
    }
    await refreshSelfEvents();
  }, [isClientAgendaMode, clientEventsQuery, refreshSelfEvents]);

  const effectiveSilverKeyCalendarId = isClientAgendaMode ? null : silverKeyCalendarId;

  const {
    allAgendaModalItems,
    refreshAllAgendaEvents,
    allAgendaEventsLoading,
    allAgendaEventsQueryEnabled,
  } = useAllAgendaEventsModalQuery({
    modalOpen: allAgendaEventsModalOpen,
    isConnected,
    silverKeyCalendarId: effectiveSilverKeyCalendarId,
    agendaTodos,
    clientUserId: isClientAgendaMode ? clientUserId : null,
  });

  const upcomingEvents = useMemo(
    () => filterUpcomingEvents(upcomingEventsRaw, effectiveSilverKeyCalendarId),
    [upcomingEventsRaw, effectiveSilverKeyCalendarId]
  );

  const agendaTodosInRange = useMemo(() => {
    if (!agendaTodos?.length) {
      return [];
    }
    return filterTodosInRange(agendaTodos, upcomingDateRange.timeMin, upcomingDateRange.timeMax);
  }, [agendaTodos, upcomingDateRange.timeMin, upcomingDateRange.timeMax]);

  const agendaTodosIncompleteInRange = useMemo(
    () => agendaTodosInRange.filter((t) => !t.completed),
    [agendaTodosInRange]
  );

  const completedAgendaTodosSorted = useMemo(() => {
    if (!agendaTodos?.length) {
      return [];
    }
    return sortCompletedAgendaTodosForDisplay(agendaTodos.filter((t) => t.completed));
  }, [agendaTodos]);

  const mergedAgendaItems = useMemo(
    () => mergeUpcomingAgendaItems(upcomingEvents, agendaTodosIncompleteInRange),
    [upcomingEvents, agendaTodosIncompleteInRange]
  );

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  const shouldShowConnectionPrompt = useMemo(() => {
    if (isClientAgendaMode || connectionStatusLoading) {
      return false;
    }
    if (!isConnected) {
      return true;
    }
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) {
        return true;
      }
    }
    return false;
  }, [
    isClientAgendaMode,
    connectionStatusLoading,
    isConnected,
    permissions,
    hasRequiredPermissions,
    isPartiallyEnabled,
  ]);

  const permissionsReady = isClientAgendaMode || (!permissionsLoading && permissions !== undefined);

  const useAgendaList = agendaTodos !== undefined;

  const showDisplayAll = useMemo(() => {
    if (isClientAgendaMode) {
      return true;
    }
    if (!permissionsReady) {
      return false;
    }
    if (!shouldShowConnectionPrompt) {
      return true;
    }
    return Boolean(agendaTodos?.length);
  }, [isClientAgendaMode, permissionsReady, shouldShowConnectionPrompt, agendaTodos]);

  const openAllAgendaModal = useCallback(() => {
    setAllAgendaEventsModalOpen(true);
  }, []);

  const { agendaHeaderActions, eventListHeaderActions } = useUpcomingAgendaHeaderActions({
    showDisplayAll,
    headerActions,
    openAllAgendaModal,
  });

  const calendarsForAgenda = isClientAgendaMode ? [] : scopedCalendars;

  const agendaListProps = {
    embedInListHeader,
    border: "light" as const,
    title: AGENDA_TITLE,
    emptyMessage: "No upcoming events or to-dos in the next week",
    headerActions: agendaHeaderActions,
    silverKeyCalendarId: effectiveSilverKeyCalendarId,
    refreshEvents,
    updateEvent: isClientAgendaMode ? undefined : selfUpdateEvent,
    deleteEvent: isClientAgendaMode ? undefined : selfDeleteEvent,
    calendars: calendarsForAgenda,
    onToggleAgendaTodo,
    canEditAgendaTodos,
    onSigningAgendaPress,
  };

  const clientAgendaLoading = isClientAgendaMode && clientEventsQuery.isLoading;

  const clientCalendarAccessError =
    isClientAgendaMode &&
    clientEventsQuery.isError &&
    isClientCalendarAccessError(clientEventsQuery.error)
      ? clientEventsQuery.error
      : null;

  const clientAgendaErrorMessage =
    isClientAgendaMode && clientEventsQuery.isError && !clientCalendarAccessError
      ? clientEventsQuery.error instanceof Error
        ? clientEventsQuery.error.message
        : "Could not load this client’s calendar."
      : null;

  return {
    isClientAgendaMode,
    clientAgendaLoading,
    clientCalendarAccessError,
    clientAgendaErrorMessage,
    embedInListHeader,
    suppressConnectionPrompt,
    agendaTodos,
    onToggleAgendaTodo,
    canEditAgendaTodos,
    onSigningAgendaPress,
    isConnected,
    calendarsLoading,
    connectGoogleCalendar,
    scopedCalendars,
    silverKeyCalendarId: effectiveSilverKeyCalendarId,
    permissionsReady,
    connectionStatusLoading,
    shouldShowConnectionPrompt,
    useAgendaList,
    showDisplayAll,
    allAgendaEventsModalOpen,
    setAllAgendaEventsModalOpen,
    allAgendaModalItems,
    refreshAllAgendaEvents,
    allAgendaEventsLoading,
    allAgendaEventsQueryEnabled,
    upcomingEvents,
    mergedAgendaItems,
    agendaTodosIncompleteInRange,
    completedAgendaTodosSorted,
    agendaListProps,
    eventListHeaderActions,
    handleConnect,
  };
}
